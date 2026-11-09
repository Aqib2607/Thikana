<?php

namespace Tests\Feature;

use App\Models\Amenity;
use App\Models\Area;
use App\Models\AuditLog;
use App\Models\CommunityInformation;
use App\Models\ContactRequest;
use App\Models\Conversation;
use App\Models\Favorite;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Property;
use App\Models\PropertyComparison;
use App\Models\PropertyImage;
use App\Models\PropertyLocation;
use App\Models\PropertyReport;
use App\Models\PropertyVerification;
use App\Models\RentalPreference;
use App\Models\Review;
use App\Models\Role;
use App\Models\User;
use App\Models\VisitRequest;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\DemoSeedingGuard;
use Database\Seeders\DemoUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Tests\TestCase;

class DemoDatabaseSeedingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that DemoUserSeeder immediately aborts if running in production.
     */
    public function test_production_environment_guard_aborts_demo_seeding(): void
    {
        $this->app->detectEnvironment(fn () => 'production');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('CRITICAL SAFETY VIOLATION');

        $seeder = new DemoUserSeeder;
        $seeder->run();
    }

    /**
     * Test that DemoUserSeeder immediately aborts if running in staging.
     */
    public function test_staging_environment_guard_aborts_demo_seeding(): void
    {
        $this->app->detectEnvironment(fn () => 'staging');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('CRITICAL SAFETY VIOLATION');

        $seeder = new DemoUserSeeder;
        $seeder->run();
    }

    /**
     * Test successful seeding in testing/local environment with complete relational integrity.
     */
    public function test_can_seed_complete_demo_database_in_test_environment(): void
    {
        $this->seed(DatabaseSeeder::class);

        // 1. Static taxonomies
        $this->assertEquals(3, Role::count(), 'Expected 3 roles (tenant, landlord, admin)');
        $this->assertEquals(11, Area::count(), 'Expected 11 Khulna municipal areas');
        $this->assertEquals(14, Amenity::count(), 'Expected 14 amenities in catalog');

        // 2. Demo Users (1 Admin, 8 Landlords, 20 Tenants)
        $this->assertEquals(29, User::where('email', 'like', '%@demo.test')->count(), 'Expected 29 demo users');

        $admin = User::where('email', 'admin@demo.test')->first();
        $this->assertNotNull($admin);
        $this->assertTrue($admin->hasRole('admin'));
        $this->assertEquals('active', $admin->status);
        $this->assertTrue(Hash::check('Password1', $admin->password));

        $suspendedTenant = User::where('email', 'tenant20@demo.test')->first();
        $this->assertNotNull($suspendedTenant);
        $this->assertTrue($suspendedTenant->isSuspended());

        // 3. Community Information
        $this->assertEquals(11, CommunityInformation::count(), 'Expected 11 area community profiles');

        // 4. Properties & Dependent Hierarchy
        $this->assertEquals(35, Property::count(), 'Expected 35 property listings');
        $this->assertEquals(35, PropertyLocation::count(), 'Expected 35 1:1 property locations');
        $this->assertGreaterThanOrEqual(100, PropertyImage::count(), 'Expected 100+ gallery images');
        $this->assertGreaterThanOrEqual(25, PropertyVerification::count(), 'Expected 25+ verifications');

        // 5. Tenant Preferences & Interactions
        $this->assertEquals(15, RentalPreference::count(), 'Expected 15 tenant rental preferences');
        $this->assertEquals(30, Favorite::count(), 'Expected 30 favorites');
        $this->assertEquals(12, PropertyComparison::count(), 'Expected 12 comparison slots');
        $this->assertEquals(25, Review::count(), 'Expected 25 reviews');
        $this->assertEquals(20, ContactRequest::count(), 'Expected 20 contact requests');
        $this->assertEquals(16, VisitRequest::count(), 'Expected 16 visit requests');
        $this->assertEquals(8, PropertyReport::count(), 'Expected 8 property reports');

        // 6. Communications
        $this->assertEquals(10, Conversation::count(), 'Expected 10 chat conversations');
        $this->assertGreaterThanOrEqual(40, Message::count(), 'Expected 40+ chat messages');
        $this->assertEquals(35, Notification::count(), 'Expected 35 notifications');

        // 7. Governance & Audit Trail
        $this->assertEquals(35, AuditLog::count(), 'Expected 35 administrative audit logs');
    }

    /**
     * Test idempotency: executing the complete seeding pipeline twice produces identical counts and no duplicate errors.
     */
    public function test_demo_database_seeding_is_fully_idempotent(): void
    {
        // First run
        $this->seed(DatabaseSeeder::class);

        $initialUserCount = User::count();
        $initialPropertyCount = Property::count();
        $initialLocationCount = PropertyLocation::count();
        $initialReviewCount = Review::count();
        $initialFavoriteCount = Favorite::count();
        $initialConversationCount = Conversation::count();
        $initialAuditCount = AuditLog::count();

        // Second run
        $this->seed(DatabaseSeeder::class);

        $this->assertEquals($initialUserCount, User::count(), 'User count should remain unchanged after second run');
        $this->assertEquals($initialPropertyCount, Property::count(), 'Property count should remain unchanged after second run');
        $this->assertEquals($initialLocationCount, PropertyLocation::count(), 'Location count should remain unchanged after second run');
        $this->assertEquals($initialReviewCount, Review::count(), 'Review count should remain unchanged after second run');
        $this->assertEquals($initialFavoriteCount, Favorite::count(), 'Favorite count should remain unchanged after second run');
        $this->assertEquals($initialConversationCount, Conversation::count(), 'Conversation count should remain unchanged after second run');
        $this->assertEquals($initialAuditCount, AuditLog::count(), 'Audit count should remain unchanged after second run');
    }

    /**
     * Test that existing non-demo user accounts are preserved and not overwritten or deleted.
     */
    public function test_preserves_unrelated_non_demo_users(): void
    {
        $tenantRole = Role::firstOrCreate(['slug' => 'tenant'], ['name' => 'Tenant']);

        // Create an unrelated user prior to seeding
        $customUser = new User([
            'name' => 'Real Resident User',
            'email' => 'real.resident@mycustomdomain.com',
            'phone' => '01799998888',
            'password' => Hash::make('CustomSecretPassword2026!'),
        ]);
        $customUser->role_id = $tenantRole->id;
        $customUser->status = 'active';
        $customUser->save();

        $originalPasswordHash = $customUser->password;

        // Run full database seeder
        $this->seed(DatabaseSeeder::class);

        // Verify the unrelated user is completely intact
        $refreshed = User::where('email', 'real.resident@mycustomdomain.com')->first();
        $this->assertNotNull($refreshed);
        $this->assertEquals('Real Resident User', $refreshed->name);
        $this->assertEquals($originalPasswordHash, $refreshed->password);
        $this->assertEquals($tenantRole->id, $refreshed->role_id);
    }

    /**
     * Test relational consistency across foreign keys.
     */
    public function test_relational_consistency_and_foreign_key_integrity(): void
    {
        $this->seed(DatabaseSeeder::class);

        // Check that all properties have valid landlords who hold the landlord role
        $properties = Property::with('landlord.role', 'location', 'images', 'amenities')->get();
        foreach ($properties as $prop) {
            $this->assertNotNull($prop->landlord, "Property {$prop->id} must have a landlord");
            $this->assertEquals('landlord', $prop->landlord->role?->slug, "Landlord for property {$prop->id} must have landlord role");
            $this->assertNotNull($prop->location, "Property {$prop->id} must have a location");
            $this->assertNotEmpty($prop->images, "Property {$prop->id} must have images");
            $this->assertNotEmpty($prop->amenities, "Property {$prop->id} must have amenities attached");
        }

        // Check that conversations have consistent participants
        $conversations = Conversation::with('messages', 'tenant', 'landlord', 'property')->get();
        foreach ($conversations as $conv) {
            $this->assertNotNull($conv->tenant);
            $this->assertNotNull($conv->landlord);
            $this->assertNotNull($conv->property);

            foreach ($conv->messages as $msg) {
                $this->assertTrue(
                    in_array($msg->sender_id, [$conv->tenant_id, $conv->landlord_id]),
                    'Message sender must be either the tenant or landlord of the conversation'
                );
            }
        }
    }

    /**
     * Test guard accepts approved loopback hosts.
     */
    public function test_guard_accepts_approved_local_hosts(): void
    {
        $defaultConn = config('database.default');
        $originalHost = config("database.connections.{$defaultConn}.host");

        try {
            foreach (['127.0.0.1', 'localhost', '::1', 'LOCALHOST'] as $host) {
                config(["database.connections.{$defaultConn}.host" => $host]);
                DemoSeedingGuard::assertSafeEnvironment();
                $this->assertTrue(true, "Expected host {$host} to be accepted");
            }
        } finally {
            config(["database.connections.{$defaultConn}.host" => $originalHost]);
        }
    }

    /**
     * Test guard rejects Railway-style remote hostname.
     */
    public function test_guard_rejects_railway_style_remote_hostname(): void
    {
        $defaultConn = config('database.default');
        $originalHost = config("database.connections.{$defaultConn}.host");

        try {
            config(["database.connections.{$defaultConn}.host" => 'containers-us-west-123.railway.app']);

            DemoSeedingGuard::assertSafeEnvironment();
            $this->fail('Expected RuntimeException was not thrown for Railway host');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('rejected remote or unauthorized database host', $e->getMessage());
        } finally {
            config(["database.connections.{$defaultConn}.host" => $originalHost]);
        }
    }

    /**
     * Test guard rejects public IP address.
     */
    public function test_guard_rejects_public_ip(): void
    {
        $defaultConn = config('database.default');
        $originalHost = config("database.connections.{$defaultConn}.host");

        try {
            config(["database.connections.{$defaultConn}.host" => '198.51.100.1']);

            DemoSeedingGuard::assertSafeEnvironment();
            $this->fail('Expected RuntimeException was not thrown for public IP');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('rejected remote or unauthorized database host', $e->getMessage());
        } finally {
            config(["database.connections.{$defaultConn}.host" => $originalHost]);
        }
    }

    /**
     * Test guard rejects unapproved private network IP.
     */
    public function test_guard_rejects_unapproved_private_network_ip(): void
    {
        $defaultConn = config('database.default');
        $originalHost = config("database.connections.{$defaultConn}.host");

        try {
            config(["database.connections.{$defaultConn}.host" => '192.168.1.100']);

            DemoSeedingGuard::assertSafeEnvironment();
            $this->fail('Expected RuntimeException was not thrown for private network IP');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('rejected remote or unauthorized database host', $e->getMessage());
        } finally {
            config(["database.connections.{$defaultConn}.host" => $originalHost]);
        }
    }

    /**
     * Test guard rejects missing or empty database host.
     */
    public function test_guard_rejects_missing_or_empty_database_host(): void
    {
        $defaultConn = config('database.default');
        $originalHost = config("database.connections.{$defaultConn}.host");

        try {
            config(["database.connections.{$defaultConn}.host" => '']);

            DemoSeedingGuard::assertSafeEnvironment();
            $this->fail('Expected RuntimeException was not thrown for empty host');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('Database host is missing or ambiguous', $e->getMessage());
        } finally {
            config(["database.connections.{$defaultConn}.host" => $originalHost]);
        }
    }

    /**
     * Test guard rejects unsupported database driver.
     */
    public function test_guard_rejects_unsupported_database_driver(): void
    {
        $defaultConn = config('database.default');
        $originalDriver = config("database.connections.{$defaultConn}.driver");

        try {
            config(["database.connections.{$defaultConn}.driver" => 'pgsql']);

            DemoSeedingGuard::assertSafeEnvironment();
            $this->fail('Expected RuntimeException was not thrown for unsupported driver');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString("requires the 'mysql' driver", $e->getMessage());
        } finally {
            config(["database.connections.{$defaultConn}.driver" => $originalDriver]);
        }
    }

    /**
     * Test guard directly rejects production environment.
     */
    public function test_guard_rejects_production_environment(): void
    {
        $this->app->detectEnvironment(fn () => 'production');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('prohibited in production and staging environments');

        DemoSeedingGuard::assertSafeEnvironment();
    }

    /**
     * Test guard directly rejects staging environment.
     */
    public function test_guard_rejects_staging_environment(): void
    {
        $this->app->detectEnvironment(fn () => 'staging');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('prohibited in production and staging environments');

        DemoSeedingGuard::assertSafeEnvironment();
    }

    /**
     * Test guard aborts before any demo writes when database host is remote.
     */
    public function test_guard_executes_before_child_seeders_and_performs_zero_writes(): void
    {
        $defaultConn = config('database.default');
        $originalHost = config("database.connections.{$defaultConn}.host");

        try {
            config(["database.connections.{$defaultConn}.host" => 'containers-us-west-999.railway.app']);

            $seeder = new DemoUserSeeder;
            $seeder->run();

            $this->fail('Expected DemoUserSeeder to throw RuntimeException on unauthorized host');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('rejected remote or unauthorized database host', $e->getMessage());
        } finally {
            config(["database.connections.{$defaultConn}.host" => $originalHost]);
        }

        // Verify zero demo users were written
        $this->assertEquals(0, User::where('email', 'like', '%@demo.test')->count(), 'Zero demo users must be created on aborted safety check');
    }

    /**
     * Test that CommunityInformationSeeder preserves human administrator-authored records.
     */
    public function test_community_information_preserves_administrator_authored_records(): void
    {
        // 1. Seed base taxonomies
        $adminRole = Role::firstOrCreate(['slug' => 'admin'], ['name' => 'Administrator']);
        $sonadanga = Area::firstOrCreate(['name' => 'Sonadanga R/A'], ['slug' => 'sonadanga-ra', 'city' => 'Khulna']);

        // 2. Create custom human administrator (non-demo email)
        $humanAdmin = new User([
            'name' => 'KCC Municipal Director',
            'email' => 'director@khulnacity.gov.bd',
            'phone' => '01711223344',
            'password' => Hash::make('SecretMunicipalKey2026!'),
        ]);
        $humanAdmin->role_id = $adminRole->id;
        $humanAdmin->status = 'active';
        $humanAdmin->save();

        // 3. Pre-create custom community information authored by this human administrator
        CommunityInformation::create([
            'area_id' => $sonadanga->id,
            'transport' => 'Official KCC smart bus route operating every 10 minutes.',
            'waterlogging' => 'Completed phase 2 stormwater canal overhaul in 2026; zero flooding recorded.',
            'internet' => 'Dedicated municipal fiber link installed.',
            'noise' => 'Designated quiet zone by municipal decree.',
            'safety' => 'Dedicated CC-camera grid directly linked to KMP headquarters.',
            'general' => 'Official municipal headquarters district profile.',
            'updated_by' => $humanAdmin->id,
        ]);

        // 4. Run the full database seeder
        $this->seed(DatabaseSeeder::class);

        // 5. Verify the human admin's customized community record was NOT overwritten
        $refreshed = CommunityInformation::where('area_id', $sonadanga->id)->first();
        $this->assertNotNull($refreshed);
        $this->assertEquals('Official KCC smart bus route operating every 10 minutes.', $refreshed->transport);
        $this->assertEquals('Completed phase 2 stormwater canal overhaul in 2026; zero flooding recorded.', $refreshed->waterlogging);
        $this->assertEquals($humanAdmin->id, $refreshed->updated_by);

        // Verify other areas (e.g. Boyra) were seeded with default demo content
        $boyra = Area::where('name', 'Boyra')->first();
        $this->assertNotNull($boyra);
        $boyraInfo = CommunityInformation::where('area_id', $boyra->id)->first();
        $this->assertNotNull($boyraInfo);
        $this->assertStringContainsString('Khulna Medical College', $boyraInfo->general);
    }
}
