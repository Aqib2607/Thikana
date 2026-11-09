<?php

namespace Tests\Feature\Tenant;

use App\Models\Property;
use App\Models\Review;
use App\Models\Role;
use App\Models\User;
use App\Models\VisitRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantReviewApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $tenant;

    protected User $otherTenant;

    protected User $landlord;

    protected Property $property;

    protected string $tenantToken;

    protected string $otherTenantToken;

    protected string $landlordToken;

    protected function setUp(): void
    {
        parent::setUp();

        $tenantRole = Role::firstOrCreate(['slug' => 'tenant'], ['name' => 'Tenant', 'description' => 'Tenant Role']);
        $landlordRole = Role::firstOrCreate(['slug' => 'landlord'], ['name' => 'Landlord', 'description' => 'Landlord Role']);

        $this->tenant = new User([
            'name' => 'Reviewing Tenant',
            'email' => 'tenant_rev@test.com',
            'phone' => '01711110020',
            'password' => bcrypt('Password123!'),
        ]);
        $this->tenant->role_id = $tenantRole->id;
        $this->tenant->status = 'active';
        $this->tenant->save();
        $this->tenantToken = $this->tenant->createToken('test', ['role:tenant'])->plainTextToken;

        $this->otherTenant = new User([
            'name' => 'Other Tenant',
            'email' => 'other_rev@test.com',
            'phone' => '01711110021',
            'password' => bcrypt('Password123!'),
        ]);
        $this->otherTenant->role_id = $tenantRole->id;
        $this->otherTenant->status = 'active';
        $this->otherTenant->save();
        $this->otherTenantToken = $this->otherTenant->createToken('test', ['role:tenant'])->plainTextToken;

        $this->landlord = new User([
            'name' => 'Landlord User',
            'email' => 'landlord_rev@test.com',
            'phone' => '01722220020',
            'password' => bcrypt('Password123!'),
        ]);
        $this->landlord->role_id = $landlordRole->id;
        $this->landlord->status = 'active';
        $this->landlord->save();
        $this->landlordToken = $this->landlord->createToken('test', ['role:landlord'])->plainTextToken;

        $this->property = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Quiet Student Studio in Sonadanga',
            'slug' => 'quiet-student-studio-sonadanga',
            'property_type' => 'Apartment',
            'rental_type' => 'Bachelor Flat',
            'rent' => 8000.00,
            'advance' => 16000.00,
            'bills_included' => [],
            'availability' => 'Available',
            'available_from' => '2026-11-01',
            'approval_status' => 'Approved',
            'size' => 450,
            'floor' => '1st Floor',
            'rooms' => 1,
            'bathrooms' => 1,
        ]);
    }

    public function test_guest_cannot_access_tenant_reviews(): void
    {
        $this->getJson('/api/v1/tenant/reviews')->assertUnauthorized();
        $this->postJson('/api/v1/tenant/reviews', [
            'property_id' => $this->property->id,
            'accuracy_rating' => 5,
            'landlord_behavior_rating' => 4,
            'location_rating' => 5,
            'overall_experience_rating' => 4,
            'comment' => 'Great place to study and live.',
        ])->assertUnauthorized();
    }

    public function test_tenant_submits_review_successfully_with_computed_overall_rating(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->postJson('/api/v1/tenant/reviews', [
                'property_id' => $this->property->id,
                'accuracy_rating' => 4,
                'landlord_behavior_rating' => 5,
                'location_rating' => 4,
                'overall_experience_rating' => 5,
                'comment' => 'The apartment matched the photos and description well.',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.propertyId', (string) $this->property->id)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.visitedVerified', false)
            ->assertJsonPath('data.overallRating', 4.5);

        $this->assertDatabaseHas('reviews', [
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'overall_rating' => 4.5,
            'status' => 'pending',
            'visited_verified' => false,
        ]);
    }

    public function test_tenant_with_completed_visit_receives_visited_verified_true(): void
    {
        VisitRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => '2026-11-01',
            'preferred_time_slot' => 'morning',
            'status' => 'completed',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->postJson('/api/v1/tenant/reviews', [
                'property_id' => $this->property->id,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 5,
                'location_rating' => 5,
                'overall_experience_rating' => 5,
                'comment' => 'Verified in person during scheduled physical visit.',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.visitedVerified', true);

        $this->assertEquals(5.0, (float) $response->json('data.overallRating'));

        $this->assertDatabaseHas('reviews', [
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'visited_verified' => true,
        ]);
    }

    public function test_duplicate_review_for_same_property_is_rejected(): void
    {
        Review::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'accuracy_rating' => 4,
            'landlord_behavior_rating' => 4,
            'location_rating' => 4,
            'overall_experience_rating' => 4,
            'overall_rating' => 4.0,
            'comment' => 'First review submitted for this property.',
            'status' => 'pending',
            'visited_verified' => false,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->postJson('/api/v1/tenant/reviews', [
                'property_id' => $this->property->id,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 5,
                'location_rating' => 5,
                'overall_experience_rating' => 5,
                'comment' => 'Second attempt to review same property.',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'You have already submitted a review for this property.');
    }

    public function test_review_validation_rules(): void
    {
        // Missing comment and ratings out of range
        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->postJson('/api/v1/tenant/reviews', [
                'property_id' => $this->property->id,
                'accuracy_rating' => 6, // invalid > 5
                'landlord_behavior_rating' => 0, // invalid < 1
                'location_rating' => 3,
                'overall_experience_rating' => 3,
                'comment' => 'short', // invalid < 10 chars
            ]);

        $response->assertStatus(422);
        $fieldErrors = $response->json('fieldErrors') ?? $response->json('errors') ?? [];
        $this->assertArrayHasKey('accuracy_rating', $fieldErrors);
        $this->assertArrayHasKey('landlord_behavior_rating', $fieldErrors);
        $this->assertArrayHasKey('comment', $fieldErrors);
    }

    public function test_tenant_reviews_listing_isolation(): void
    {
        // Tenant's review
        Review::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'accuracy_rating' => 4,
            'landlord_behavior_rating' => 4,
            'location_rating' => 4,
            'overall_experience_rating' => 4,
            'overall_rating' => 4.0,
            'comment' => 'Tenant own review comments.',
            'status' => 'pending',
            'visited_verified' => false,
        ]);

        // Other tenant's review on another property
        $otherProp = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Other Property',
            'slug' => 'other-property-rev',
            'property_type' => 'Apartment',
            'rental_type' => 'Family Flat',
            'rent' => 15000.00,
            'advance' => 30000.00,
            'bills_included' => [],
            'availability' => 'Available',
            'available_from' => '2026-11-01',
            'approval_status' => 'Approved',
            'size' => 900,
            'floor' => '3rd Floor',
            'rooms' => 3,
            'bathrooms' => 2,
        ]);

        Review::create([
            'tenant_id' => $this->otherTenant->id,
            'property_id' => $otherProp->id,
            'accuracy_rating' => 5,
            'landlord_behavior_rating' => 5,
            'location_rating' => 5,
            'overall_experience_rating' => 5,
            'overall_rating' => 5.0,
            'comment' => 'Other tenant review comments.',
            'status' => 'approved',
            'visited_verified' => true,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/reviews');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.propertyId', (string) $this->property->id);
    }
}
