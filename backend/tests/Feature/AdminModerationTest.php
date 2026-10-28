<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Property;
use App\Models\PropertyLocation;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminModerationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected string $adminToken;

    protected User $tenant;
    protected string $tenantToken;

    protected User $landlord;
    protected string $landlordToken;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['slug' => 'admin'], ['name' => 'Administrator', 'description' => 'Admin']);
        $tenantRole = Role::firstOrCreate(['slug' => 'tenant'], ['name' => 'Tenant', 'description' => 'Tenant']);
        $landlordRole = Role::firstOrCreate(['slug' => 'landlord'], ['name' => 'Landlord', 'description' => 'Landlord']);

        // Active Admin
        $this->admin = new User([
            'name' => 'System Admin',
            'email' => 'admin@thikana.com',
            'phone' => '01700000001',
            'password' => bcrypt('AdminSecret123!'),
        ]);
        $this->admin->role_id = $adminRole->id;
        $this->admin->status = 'active';
        $this->admin->save();
        $this->adminToken = $this->admin->createToken('admin_token', ['role:admin'])->plainTextToken;

        // Active Tenant
        $this->tenant = new User([
            'name' => 'Regular Tenant',
            'email' => 'tenant@thikana.com',
            'phone' => '01700000002',
            'password' => bcrypt('TenantSecret123!'),
        ]);
        $this->tenant->role_id = $tenantRole->id;
        $this->tenant->status = 'active';
        $this->tenant->save();
        $this->tenantToken = $this->tenant->createToken('tenant_token', ['role:tenant'])->plainTextToken;

        // Active Landlord
        $this->landlord = new User([
            'name' => 'Listing Landlord',
            'email' => 'landlord@thikana.com',
            'phone' => '01700000003',
            'password' => bcrypt('LandlordSecret123!'),
        ]);
        $this->landlord->role_id = $landlordRole->id;
        $this->landlord->status = 'active';
        $this->landlord->save();
        $this->landlordToken = $this->landlord->createToken('landlord_token', ['role:landlord'])->plainTextToken;
    }

    /**
     * Helper to create a test property with location.
     */
    protected function createProperty(string $status = 'Pending Approval'): Property
    {
        $property = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Spacious 3-Bed Apartment in Boyra',
            'bangla_title' => 'বয়রা ৩ রুমের সুন্দর ফ্ল্যাট',
            'slug' => Property::generateSlug('Spacious 3-Bed Apartment in Boyra'),
            'property_type' => 'Apartment / Flat',
            'rental_type' => 'Family Rental',
            'rent' => 15000,
            'advance' => 30000,
            'additional_charges' => 1500,
            'bills_included' => ['Water Supply'],
            'availability' => 'Available',
            'available_from' => '2026-11-01',
            'approval_status' => $status,
            'size' => 1200,
            'rooms' => 3,
            'bathrooms' => 2,
            'balconies' => 2,
            'floor' => '3rd',
            'total_floors' => 5,
            'furnished_status' => 'Unfurnished',
            'preferred_tenant' => 'Family Only',
            'public_contact_visible' => true,
        ]);

        PropertyLocation::create([
            'property_id' => $property->id,
            'division' => 'Khulna',
            'district' => 'Khulna',
            'city' => 'Khulna',
            'area' => 'Boyra',
            'exact_address' => 'House 12, Road 3, Boyra, Khulna',
            'lat' => 22.8456,
            'lng' => 89.5403,
        ]);

        return $property;
    }

    /**
     * Test guests receive 401 Unauthorized on admin endpoints.
     */
    public function test_unauthenticated_guests_cannot_access_admin_endpoints(): void
    {
        $response = $this->getJson('/api/v1/admin/dashboard/stats');
        $response->assertStatus(401);

        $responseProps = $this->getJson('/api/v1/admin/properties');
        $responseProps->assertStatus(401);

        $responseLogs = $this->getJson('/api/v1/admin/audit-logs');
        $responseLogs->assertStatus(401);
    }

    /**
     * Test non-admin authenticated users receive 403 Forbidden.
     */
    public function test_tenants_and_landlords_cannot_access_admin_endpoints(): void
    {
        $property = $this->createProperty('Pending Approval');

        // Tenant attempt
        $responseTenant = $this->withHeader('Authorization', 'Bearer ' . $this->tenantToken)
            ->getJson('/api/v1/admin/dashboard/stats');
        $responseTenant->assertStatus(403);

        // Landlord attempt to access moderation list
        $responseLandlord = $this->withHeader('Authorization', 'Bearer ' . $this->landlordToken)
            ->getJson('/api/v1/admin/properties');
        $responseLandlord->assertStatus(403);

        // Landlord attempt to self-approve listing
        $responseSelfApprove = $this->withHeader('Authorization', 'Bearer ' . $this->landlordToken)
            ->postJson("/api/v1/admin/properties/{$property->id}/approve");
        $responseSelfApprove->assertStatus(403);
    }

    /**
     * Test suspended admins cannot access admin endpoints.
     */
    public function test_suspended_admins_cannot_access_admin_endpoints(): void
    {
        $this->admin->status = 'suspended';
        $this->admin->save();

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/v1/admin/dashboard/stats');

        $response->assertStatus(403);
    }

    /**
     * Test active admin can view stats and properties list.
     */
    public function test_admin_can_view_stats_and_filter_properties(): void
    {
        $this->createProperty('Pending Approval');
        $this->createProperty('Approved');

        // Stats endpoint
        $responseStats = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/v1/admin/dashboard/stats');

        $responseStats->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'pendingProperties',
                    'approvedProperties',
                    'totalProperties',
                    'totalUsers',
                    'tenantUsers',
                    'landlordUsers',
                    'pendingReports',
                    'totalReviews',
                    'auditLogsCount',
                ],
            ]);

        $this->assertEquals(1, $responseStats->json('data.pendingProperties'));
        $this->assertEquals(1, $responseStats->json('data.approvedProperties'));
        $this->assertEquals(2, $responseStats->json('data.totalProperties'));

        // Filtered properties endpoint
        $responseFilter = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/v1/admin/properties?statusFilter=Pending%20Approval');

        $responseFilter->assertStatus(200);
        $this->assertCount(1, $responseFilter->json('data'));
        $this->assertEquals('Pending Approval', $responseFilter->json('data.0.approvalStatus'));
    }

    /**
     * Test admin can approve a pending listing, creating an atomic audit log.
     */
    public function test_admin_can_approve_property_and_atomic_audit_log_is_created(): void
    {
        $property = $this->createProperty('Pending Approval');

        // Initially not discoverable
        $publicBefore = $this->getJson('/api/v1/properties');
        $publicBefore->assertStatus(200);
        $this->assertCount(0, $publicBefore->json('data'));

        // Admin approves
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/v1/admin/properties/{$property->id}/approve");

        $response->assertStatus(200)
            ->assertJsonPath('data.approvalStatus', 'Approved');

        // Verify database state
        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'approval_status' => 'Approved',
        ]);

        // Verify audit log
        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => $this->admin->id,
            'actor_name' => 'System Admin',
            'action' => 'PROPERTY_APPROVED',
            'target_type' => 'property',
            'target_id' => (string) $property->id,
        ]);

        // Now discoverable publicly
        $publicAfter = $this->getJson('/api/v1/properties');
        $publicAfter->assertStatus(200);
        $this->assertCount(1, $publicAfter->json('data'));
        $this->assertEquals((string) $property->id, $publicAfter->json('data.0.id'));
    }

    /**
     * Test admin can reject a listing with a reason, creating an atomic audit log.
     */
    public function test_admin_can_reject_property_with_reason_and_creates_audit_log(): void
    {
        $property = $this->createProperty('Pending Approval');

        // Reject without reason fails validation
        $failResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/v1/admin/properties/{$property->id}/reject", []);
        $failResponse->assertStatus(422)
            ->assertJsonPath('status', 422);
        $this->assertArrayHasKey('reason', $failResponse->json('fieldErrors'));

        // Reject with valid reason
        $reason = 'Rent amount is inconsistent with market rate and property images are blurry.';
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/v1/admin/properties/{$property->id}/reject", [
                'reason' => $reason,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.approvalStatus', 'Rejected');

        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'approval_status' => 'Rejected',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => $this->admin->id,
            'action' => 'PROPERTY_REJECTED',
            'target_type' => 'property',
            'target_id' => (string) $property->id,
        ]);

        $auditLog = AuditLog::where('target_id', (string) $property->id)->first();
        $this->assertStringContainsString($reason, $auditLog->details);

        // Not discoverable in public search
        $publicAfter = $this->getJson('/api/v1/properties');
        $publicAfter->assertStatus(200);
        $this->assertCount(0, $publicAfter->json('data'));
    }

    /**
     * Test admin can update simulated verifications for a property.
     */
    public function test_admin_can_update_property_verifications(): void
    {
        $property = $this->createProperty('Approved');

        $verifications = [
            'Owner Identity Verified',
            'Phone Verified',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson("/api/v1/admin/properties/{$property->id}/verifications", [
                'verifications' => $verifications,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.verifications', $verifications);

        $this->assertDatabaseCount('property_verifications', 2);
        $this->assertDatabaseHas('property_verifications', [
            'property_id' => $property->id,
            'verification_type' => 'Owner Identity Verified',
            'verified_by' => $this->admin->id,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => $this->admin->id,
            'action' => 'VERIFICATION_UPDATED',
            'target_type' => 'property',
            'target_id' => (string) $property->id,
        ]);

        // Invalid verification type validation check
        $invalidResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson("/api/v1/admin/properties/{$property->id}/verifications", [
                'verifications' => ['Invalid Fake Verification Token'],
            ]);

        $invalidResponse->assertStatus(422)
            ->assertJsonPath('status', 422);
        $this->assertArrayHasKey('verifications.0', $invalidResponse->json('fieldErrors'));
    }

    /**
     * Test admin can read and update community intelligence.
     */
    public function test_admin_can_read_and_update_community_data(): void
    {
        // View community map
        $indexResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/v1/admin/community');

        $indexResponse->assertStatus(200)
            ->assertJsonStructure(['data']);

        $this->assertArrayHasKey('Boyra', $indexResponse->json('data'));

        // Update community intelligence for Boyra
        $updateResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson('/api/v1/admin/community/Boyra', [
                'transport' => 'Easy bike and rickshaw readily available at all hours.',
                'waterlogging' => 'Rarely floods even during heavy monsoon rainfall.',
                'internet' => 'Fiber broadband available from multiple major ISPs.',
                'safety' => 'Safe residential environment with night guard patrol.',
            ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.area', 'Boyra')
            ->assertJsonPath('data.transport', 'Easy bike and rickshaw readily available at all hours.');

        $this->assertDatabaseHas('community_information', [
            'transport' => 'Easy bike and rickshaw readily available at all hours.',
            'updated_by' => $this->admin->id,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => $this->admin->id,
            'action' => 'COMMUNITY_DATA_UPDATED',
            'target_type' => 'community',
            'target_id' => 'Boyra',
        ]);
    }

    /**
     * Test admin can retrieve paginated audit logs.
     */
    public function test_admin_can_retrieve_audit_logs(): void
    {
        AuditLog::logAction($this->admin, 'TEST_ACTION_ONE', 'property', '101', 'Test note 1');
        AuditLog::logAction($this->admin, 'TEST_ACTION_TWO', 'property', '102', 'Test note 2');

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/v1/admin/audit-logs');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'actorId',
                        'actorName',
                        'action',
                        'targetType',
                        'targetId',
                        'details',
                        'timestamp',
                    ],
                ],
                'links',
                'meta',
            ]);

        $this->assertCount(2, $response->json('data'));
    }
}
