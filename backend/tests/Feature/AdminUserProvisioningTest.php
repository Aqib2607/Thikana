<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminUserProvisioningTest extends TestCase
{
    use RefreshDatabase;

    protected Role $adminRole;

    protected Role $tenantRole;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminRole = Role::firstOrCreate(
            ['slug' => 'admin'],
            ['name' => 'Administrator', 'description' => 'System administrator']
        );

        $this->tenantRole = Role::firstOrCreate(
            ['slug' => 'tenant'],
            ['name' => 'Tenant', 'description' => 'Tenant user']
        );
    }

    /**
     * Test successful administrator creation, role assignment, and password hashing.
     */
    public function test_can_successfully_provision_administrator(): void
    {
        $this->artisan('admin:create')
            ->expectsQuestion('Administrator full name', 'Tahmid Rahman')
            ->expectsQuestion('Administrator email address', 'tahmid.admin@example.com')
            ->expectsQuestion('Enter administrator password (minimum 8 characters)', 'SecretAdminPass123!')
            ->expectsQuestion('Confirm administrator password', 'SecretAdminPass123!')
            ->assertExitCode(0);

        /** @var User|null $admin */
        $admin = User::where('email', 'tahmid.admin@example.com')->first();
        $this->assertNotNull($admin);
        $this->assertEquals('Tahmid Rahman', $admin->name);
        $this->assertEquals($this->adminRole->id, $admin->role_id);
        $this->assertTrue($admin->hasRole('admin'));
        $this->assertEquals('active', $admin->status);
        $this->assertNotNull($admin->email_verified_at);
        $this->assertTrue(Hash::check('SecretAdminPass123!', $admin->password));
    }

    /**
     * Test command options for name and email prefill.
     */
    public function test_can_provision_administrator_with_cli_options(): void
    {
        $this->artisan('admin:create', [
            '--name' => 'Farhana Kabir',
            '--email' => 'farhana.admin@example.com',
        ])
            ->expectsQuestion('Enter administrator password (minimum 8 characters)', 'FarhanaSecure2026!')
            ->expectsQuestion('Confirm administrator password', 'FarhanaSecure2026!')
            ->assertExitCode(0);

        $this->assertDatabaseHas('users', [
            'email' => 'farhana.admin@example.com',
            'name' => 'Farhana Kabir',
            'role_id' => $this->adminRole->id,
        ]);
    }

    /**
     * Test password confirmation mismatch aborts creation.
     */
    public function test_fails_when_password_confirmation_does_not_match(): void
    {
        $this->artisan('admin:create')
            ->expectsQuestion('Administrator full name', 'Mismatch User')
            ->expectsQuestion('Administrator email address', 'mismatch@example.com')
            ->expectsQuestion('Enter administrator password (minimum 8 characters)', 'PasswordOne123!')
            ->expectsQuestion('Confirm administrator password', 'DifferentPassword456!')
            ->assertExitCode(1);

        $this->assertDatabaseMissing('users', ['email' => 'mismatch@example.com']);
    }

    /**
     * Test invalid email format is rejected.
     */
    public function test_fails_with_invalid_email_format(): void
    {
        $this->artisan('admin:create', [
            '--name' => 'Invalid Email Admin',
            '--email' => 'not-an-email-address',
        ])
            ->assertExitCode(1);

        $this->assertDatabaseMissing('users', ['name' => 'Invalid Email Admin']);
    }

    /**
     * Test duplicate administrator email is rejected and existing admin preserved.
     */
    public function test_fails_when_administrator_email_already_exists(): void
    {
        $existingAdmin = new User([
            'name' => 'Existing Root Admin',
            'email' => 'root.admin@example.com',
            'password' => Hash::make('OriginalPassword123!'),
        ]);
        $existingAdmin->role_id = $this->adminRole->id;
        $existingAdmin->status = 'active';
        $existingAdmin->save();

        $this->artisan('admin:create', [
            '--name' => 'Duplicate Attempt',
            '--email' => 'root.admin@example.com',
        ])
            ->assertExitCode(1);

        // Verify existing admin was untouched
        $refreshedAdmin = $existingAdmin->fresh();
        $this->assertNotNull($refreshedAdmin);
        $this->assertEquals('Existing Root Admin', $refreshedAdmin->name);
        $this->assertTrue(Hash::check('OriginalPassword123!', $refreshedAdmin->password));
    }

    /**
     * Test short password rejected.
     */
    public function test_fails_when_password_is_under_eight_characters(): void
    {
        $this->artisan('admin:create')
            ->expectsQuestion('Administrator full name', 'Short Pass Admin')
            ->expectsQuestion('Administrator email address', 'shortpass@example.com')
            ->expectsQuestion('Enter administrator password (minimum 8 characters)', 'short')
            ->expectsQuestion('Confirm administrator password', 'short')
            ->assertExitCode(1);

        $this->assertDatabaseMissing('users', ['email' => 'shortpass@example.com']);
    }

    /**
     * Test existing tenant/landlord user cannot be hijacked or promoted.
     */
    public function test_fails_when_email_belongs_to_existing_tenant_or_landlord(): void
    {
        $tenant = new User([
            'name' => 'Regular Tenant',
            'email' => 'tenant@example.com',
            'phone' => '01711119999',
            'password' => Hash::make('TenantPassword123!'),
        ]);
        $tenant->role_id = $this->tenantRole->id;
        $tenant->status = 'active';
        $tenant->save();

        $this->artisan('admin:create', [
            '--name' => 'Promoted Admin',
            '--email' => 'tenant@example.com',
        ])
            ->assertExitCode(1);

        // Ensure user was not converted to admin
        $refreshedTenant = $tenant->fresh();
        $this->assertNotNull($refreshedTenant);
        $this->assertEquals($this->tenantRole->id, $refreshedTenant->role_id);
        $this->assertFalse($refreshedTenant->hasRole('admin'));
    }

    /**
     * Test database failure handling.
     */
    public function test_handles_database_exception_gracefully(): void
    {
        User::saving(function () {
            throw new \RuntimeException('Simulated database deadlock during admin creation');
        });

        $this->artisan('admin:create', [
            '--name' => 'Error Test Admin',
            '--email' => 'error.admin@example.com',
        ])
            ->expectsQuestion('Enter administrator password (minimum 8 characters)', 'SafePassword123!')
            ->expectsQuestion('Confirm administrator password', 'SafePassword123!')
            ->assertExitCode(1);

        $this->assertDatabaseMissing('users', ['email' => 'error.admin@example.com']);
    }

    /**
     * Test plaintext password is never exposed in command output.
     */
    public function test_plaintext_password_is_not_exposed_in_command_output(): void
    {
        $sensitivePassword = 'SuperSecretUnrevealedPassword2026!';

        $this->artisan('admin:create', [
            '--name' => 'Hidden Password Admin',
            '--email' => 'hidden.admin@example.com',
        ])
            ->expectsQuestion('Enter administrator password (minimum 8 characters)', $sensitivePassword)
            ->expectsQuestion('Confirm administrator password', $sensitivePassword)
            ->doesntExpectOutputToContain($sensitivePassword)
            ->assertExitCode(0);
    }

    /**
     * Test public registration still strictly rejects administrator role assignment.
     */
    public function test_public_registration_still_rejects_admin_role(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Malicious Public Admin Attempt',
            'email' => 'public.admin@example.com',
            'phone' => '01711118888',
            'password' => 'Password123!',
            'role' => 'admin',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('fieldErrors.role.0', 'auth.errors.invalidRole');

        $this->assertDatabaseMissing('users', ['email' => 'public.admin@example.com']);
    }
}
