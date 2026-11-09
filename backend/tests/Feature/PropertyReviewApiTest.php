<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\Review;
use App\Models\Role;
use App\Models\User;
use App\Models\VisitRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PropertyReviewApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $tenant;
    protected User $tenantWithVisit;
    protected User $landlord;
    protected User $admin;
    protected Property $property;
    protected string $tenantToken;
    protected string $tenantWithVisitToken;
    protected string $landlordToken;
    protected string $adminToken;

    protected function setUp(): void
    {
        parent::setUp();

        $tenantRole = Role::firstOrCreate(['slug' => 'tenant'], ['name' => 'Tenant', 'description' => 'Tenant Role']);
        $landlordRole = Role::firstOrCreate(['slug' => 'landlord'], ['name' => 'Landlord', 'description' => 'Landlord Role']);
        $adminRole = Role::firstOrCreate(['slug' => 'admin'], ['name' => 'Admin', 'description' => 'Admin Role']);

        $this->tenant = new User([
            'name' => 'Arif Tenant',
            'email' => 'arif_review@test.com',
            'phone' => '01711110005',
            'password' => bcrypt('Password123!'),
        ]);
        $this->tenant->role_id = $tenantRole->id;
        $this->tenant->status = 'active';
        $this->tenant->save();
        $this->tenantToken = $this->tenant->createToken('test', ['role:tenant'])->plainTextToken;

        $this->tenantWithVisit = new User([
            'name' => 'Visited Tenant',
            'email' => 'visited_review@test.com',
            'phone' => '01711110006',
            'password' => bcrypt('Password123!'),
        ]);
        $this->tenantWithVisit->role_id = $tenantRole->id;
        $this->tenantWithVisit->status = 'active';
        $this->tenantWithVisit->save();
        $this->tenantWithVisitToken = $this->tenantWithVisit->createToken('test', ['role:tenant'])->plainTextToken;

        $this->landlord = new User([
            'name' => 'Kabir Landlord',
            'email' => 'kabir_review@test.com',
            'phone' => '01722220003',
            'password' => bcrypt('Password123!'),
        ]);
        $this->landlord->role_id = $landlordRole->id;
        $this->landlord->status = 'active';
        $this->landlord->save();
        $this->landlordToken = $this->landlord->createToken('test', ['role:landlord'])->plainTextToken;

        $this->admin = new User([
            'name' => 'Admin User',
            'email' => 'admin_review@test.com',
            'phone' => '01733330001',
            'password' => bcrypt('Password123!'),
        ]);
        $this->admin->role_id = $adminRole->id;
        $this->admin->status = 'active';
        $this->admin->save();
        $this->adminToken = $this->admin->createToken('test', ['role:admin'])->plainTextToken;

        $this->property = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Comfortable 3-Bed Family Flat',
            'slug' => 'comfortable-3-bed-family-flat-rev-test',
            'property_type' => 'Apartment',
            'rental_type' => 'Family Flat',
            'rent' => 15000.00,
            'advance' => 30000.00,
            'bills_included' => [],
            'availability' => 'Available',
            'available_from' => '2026-11-01',
            'approval_status' => 'Approved',
            'size' => 1100,
            'floor' => '3rd Floor',
            'rooms' => 3,
            'bathrooms' => 2,
            'rating' => 0.0,
            'review_count' => 0,
        ]);

        // Create completed visit for tenantWithVisit
        VisitRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenantWithVisit->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => '2026-11-01',
            'preferred_time_slot' => 'morning',
            'status' => 'completed',
        ]);
    }

    public function test_unauthenticated_user_cannot_submit_review(): void
    {
        $this->postJson('/api/v1/tenant/reviews', [
            'property_id' => $this->property->id,
            'accuracy_rating' => 5,
            'landlord_behavior_rating' => 4,
            'location_rating' => 5,
            'overall_experience_rating' => 4,
            'comment' => 'This is an excellent family apartment in Khulna.',
        ])->assertUnauthorized();
    }

    public function test_landlord_cannot_submit_review(): void
    {
        $this->withHeader('Authorization', "Bearer {$this->landlordToken}")
            ->postJson('/api/v1/tenant/reviews', [
                'property_id' => $this->property->id,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 4,
                'location_rating' => 5,
                'overall_experience_rating' => 4,
                'comment' => 'This is an excellent family apartment in Khulna.',
            ])->assertForbidden();
    }

    public function test_tenant_submits_valid_review_with_server_side_overall_rating(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->postJson('/api/v1/tenant/reviews', [
                'property_id' => $this->property->id,
                'accuracy_rating' => 4,
                'landlord_behavior_rating' => 5,
                'location_rating' => 4,
                'overall_experience_rating' => 5,
                'comment' => 'Very clean and spacious environment. Landlord was very helpful.',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.overallRating', 4.5)
            ->assertJsonPath('data.visitedVerified', false);

        $this->assertDatabaseHas('reviews', [
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'status' => 'pending',
            'visited_verified' => 0,
        ]);
    }

    public function test_server_side_visit_verification_and_anti_forgery(): void
    {
        // Tenant with completed visit submits review with attempted client forge 'visited_verified' => false
        $response = $this->withHeader('Authorization', "Bearer {$this->tenantWithVisitToken}")
            ->postJson('/api/v1/tenant/reviews', [
                'property_id' => $this->property->id,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 5,
                'location_rating' => 5,
                'overall_experience_rating' => 5,
                'comment' => 'Completed visit confirmed. Great property exactly as described.',
                'visited_verified' => false, // Attempt to forge / override
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.visitedVerified', true);

        auth('sanctum')->forgetUser();
        $this->flushHeaders();

        // Tenant without visit attempts to forge 'visited_verified' => true
        $forgedResponse = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->postJson('/api/v1/tenant/reviews', [
                'property_id' => $this->property->id,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 5,
                'location_rating' => 5,
                'overall_experience_rating' => 5,
                'comment' => 'Attempting to forge visited badge without completing a visit.',
                'visited_verified' => true, // Malicious payload
            ]);

        $forgedResponse->assertStatus(201)
            ->assertJsonPath('data.visitedVerified', false);
    }

    public function test_duplicate_review_is_rejected_with_422(): void
    {
        // First review
        $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->postJson('/api/v1/tenant/reviews', [
                'property_id' => $this->property->id,
                'accuracy_rating' => 4,
                'landlord_behavior_rating' => 4,
                'location_rating' => 4,
                'overall_experience_rating' => 4,
                'comment' => 'First review comment for this property.',
            ])->assertStatus(201);

        // Second review by same tenant on same property
        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->postJson('/api/v1/tenant/reviews', [
                'property_id' => $this->property->id,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 5,
                'location_rating' => 5,
                'overall_experience_rating' => 5,
                'comment' => 'Duplicate attempt should be rejected.',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'You have already submitted a review for this property.');
    }

    public function test_invalid_ratings_fail_validation(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->postJson('/api/v1/tenant/reviews', [
                'property_id' => $this->property->id,
                'accuracy_rating' => 6, // Invalid > 5
                'landlord_behavior_rating' => 0, // Invalid < 1
                'location_rating' => 4,
                'overall_experience_rating' => 4,
                'comment' => 'Valid length comment.',
            ]);

        $response->assertStatus(422);
        $fieldErrors = $response->json('fieldErrors') ?? $response->json('errors') ?? [];
        $this->assertArrayHasKey('accuracy_rating', $fieldErrors);
        $this->assertArrayHasKey('landlord_behavior_rating', $fieldErrors);
    }

    public function test_pending_review_not_publicly_visible_until_approved(): void
    {
        $review = Review::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'overall_rating' => 4.5,
            'accuracy_rating' => 4,
            'landlord_behavior_rating' => 5,
            'location_rating' => 4,
            'overall_experience_rating' => 5,
            'comment' => 'Pending review waiting for admin moderation.',
            'status' => 'pending',
            'visited_verified' => false,
        ]);

        // Public review listing (authenticated discovery)
        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson("/api/v1/properties/{$this->property->id}/reviews");

        $response->assertOk()
            ->assertJsonCount(0, 'data');

        auth('sanctum')->forgetUser();
        $this->flushHeaders();

        // Admin approves review
        $approveResponse = $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->postJson("/api/v1/admin/reviews/{$review->id}/approve", [
                'admin_notes' => 'Review verified and compliant.',
            ]);
        $approveResponse->assertOk()
            ->assertJsonPath('data.status', 'approved');

        auth('sanctum')->forgetUser();
        $this->flushHeaders();

        // Now it appears in public review listing
        $publicAfter = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson("/api/v1/properties/{$this->property->id}/reviews");

        $publicAfter->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', (string) $review->id);
    }

    public function test_admin_reject_removes_from_public_listing(): void
    {
        $review = Review::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'overall_rating' => 4.0,
            'accuracy_rating' => 4,
            'landlord_behavior_rating' => 4,
            'location_rating' => 4,
            'overall_experience_rating' => 4,
            'comment' => 'Review that will be rejected.',
            'status' => 'approved',
            'visited_verified' => false,
        ]);

        $reject = $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->postJson("/api/v1/admin/reviews/{$review->id}/reject", [
                'admin_notes' => 'Violates community guidelines.',
            ]);
        $reject->assertOk()
            ->assertJsonPath('data.status', 'rejected');

        auth('sanctum')->forgetUser();
        $this->flushHeaders();

        $public = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson("/api/v1/properties/{$this->property->id}/reviews");

        $public->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_rating_aggregates_update_upon_approval_and_rejection(): void
    {
        $review1 = Review::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'overall_rating' => 4.0,
            'accuracy_rating' => 4,
            'landlord_behavior_rating' => 4,
            'location_rating' => 4,
            'overall_experience_rating' => 4,
            'comment' => 'First review comment.',
            'status' => 'pending',
        ]);

        $review2 = Review::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenantWithVisit->id,
            'overall_rating' => 5.0,
            'accuracy_rating' => 5,
            'landlord_behavior_rating' => 5,
            'location_rating' => 5,
            'overall_experience_rating' => 5,
            'comment' => 'Second review comment.',
            'status' => 'pending',
        ]);

        // Property initial aggregates
        $this->assertEquals(0.0, (float) $this->property->fresh()->rating);
        $this->assertEquals(0, $this->property->fresh()->review_count);

        auth('sanctum')->forgetUser();
        $this->flushHeaders();

        // Approve review 1 (rating 4.0)
        $r1 = $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->postJson("/api/v1/admin/reviews/{$review1->id}/approve");
        $r1->assertOk();

        $p1 = $this->property->fresh();
        $this->assertEquals(4.0, (float) $p1->rating);
        $this->assertEquals(1, $p1->review_count);

        // Approve review 2 (rating 5.0 -> avg 4.5)
        $r2 = $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->postJson("/api/v1/admin/reviews/{$review2->id}/approve");
        $r2->assertOk();

        $p2 = $this->property->fresh();
        $this->assertEquals(4.5, (float) $p2->rating);
        $this->assertEquals(2, $p2->review_count);

        // Reject review 2 (rating reverts to 4.0, count 1)
        $r3 = $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->postJson("/api/v1/admin/reviews/{$review2->id}/reject");
        $r3->assertOk();

        $p3 = $this->property->fresh();
        $this->assertEquals(4.0, (float) $p3->rating);
        $this->assertEquals(1, $p3->review_count);
    }

    public function test_non_admin_cannot_moderate_reviews(): void
    {
        $review = Review::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'overall_rating' => 4.0,
            'accuracy_rating' => 4,
            'landlord_behavior_rating' => 4,
            'location_rating' => 4,
            'overall_experience_rating' => 4,
            'comment' => 'Sample review.',
            'status' => 'pending',
        ]);

        $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->postJson("/api/v1/admin/reviews/{$review->id}/approve")
            ->assertForbidden();

        $this->withHeader('Authorization', "Bearer {$this->landlordToken}")
            ->postJson("/api/v1/admin/reviews/{$review->id}/approve")
            ->assertForbidden();
    }
}
