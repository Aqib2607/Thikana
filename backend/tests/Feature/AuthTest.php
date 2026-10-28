<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    public function test_user_can_register_as_tenant(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Test Tenant',
            'email' => 'test_tenant@example.com',
            'phone' => '01700000001',
            'password' => 'Password123!',
            'role' => 'tenant',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.user.email', 'test_tenant@example.com')
            ->assertJsonPath('data.user.role', 'tenant')
            ->assertJsonStructure(['data' => ['user', 'token']]);

        $this->assertDatabaseHas('users', ['email' => 'test_tenant@example.com']);
    }

    public function test_user_cannot_register_as_admin_via_public_endpoint(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Malicious Admin',
            'email' => 'hacker@example.com',
            'phone' => '01700000002',
            'password' => 'Password123!',
            'role' => 'admin',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('status', 422);

        $this->assertDatabaseMissing('users', ['email' => 'hacker@example.com']);
    }

    public function test_user_can_login_with_email(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        User::create([
            'name' => 'Login Tester',
            'email' => 'login_tester@example.com',
            'phone' => '01700000003',
            'password' => 'Secret123',
            'role_id' => $tenantRole->id,
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'login_tester@example.com',
            'password' => 'Secret123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.user.email', 'login_tester@example.com')
            ->assertJsonStructure(['data' => ['user', 'token']]);
    }

    public function test_user_can_login_with_phone(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        User::create([
            'name' => 'Phone Tester',
            'email' => 'phone_tester@example.com',
            'phone' => '01700000004',
            'password' => 'Secret123',
            'role_id' => $tenantRole->id,
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'identifier' => '01700000004',
            'password' => 'Secret123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.user.phone', '01700000004');
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'nonexistent@example.com',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('status', 401)
            ->assertJsonPath('message', 'auth.errors.invalid');
    }

    public function test_suspended_user_cannot_login(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = new User([
            'name' => 'Suspended User',
            'email' => 'suspended@example.com',
            'phone' => '01700000005',
            'password' => 'Secret123',
        ]);
        $user->role_id = $tenantRole->id;
        $user->status = 'suspended';
        $user->save();

        $response = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'suspended@example.com',
            'password' => 'Secret123',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('status', 403)
            ->assertJsonPath('message', 'auth.errors.suspended');
    }

    public function test_authenticated_user_can_access_me_endpoint(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = User::create([
            'name' => 'Me Tester',
            'email' => 'me_tester@example.com',
            'phone' => '01700000006',
            'password' => 'Secret123',
            'role_id' => $tenantRole->id,
            'status' => 'active',
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJsonPath('data.user.email', 'me_tester@example.com');
    }

    public function test_user_can_logout_and_token_is_revoked(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = new User([
            'name' => 'Logout Tester',
            'email' => 'logout_tester@example.com',
            'phone' => '01700000007',
            'password' => 'Secret123',
        ]);
        $user->role_id = $tenantRole->id;
        $user->status = 'active';
        $user->save();

        $token = $user->createToken('logout-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/auth/logout');

        $response->assertStatus(200);

        // Verify token was deleted from database
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
        ]);

        // Reset in-memory auth guard cache for consecutive test request
        $this->app['auth']->forgetGuards();

        // Subsequent call with revoked token returns 401
        $subsequent = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/auth/me');

        $subsequent->assertStatus(401);
    }
}

