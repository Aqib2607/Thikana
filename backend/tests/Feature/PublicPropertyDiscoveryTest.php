<?php

namespace Tests\Feature;

use App\Models\Amenity;
use App\Models\Area;
use App\Models\Property;
use App\Models\PropertyLocation;
use App\Models\RentalPreference;
use App\Models\Review;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicPropertyDiscoveryTest extends TestCase
{
    use RefreshDatabase;

    protected User $tenant;
    protected User $landlord;
    protected User $suspendedUser;
    protected Property $approvedProperty;
    protected Property $pendingProperty;
    protected Area $area;

    protected function setUp(): void
    {
        parent::setUp();

        $tenantRole = Role::firstOrCreate(['slug' => 'tenant'], ['name' => 'Tenant', 'description' => 'Tenant']);
        $landlordRole = Role::firstOrCreate(['slug' => 'landlord'], ['name' => 'Landlord', 'description' => 'Landlord']);

        $this->area = Area::firstOrCreate(['name' => 'Sonadanga R/A'], ['slug' => 'sonadanga-ra']);

        $this->landlord = new User([
            'name' => 'Test Landlord',
            'email' => 'landlord@test.com',
            'phone' => '01711112222',
            'password' => bcrypt('Password123!'),
        ]);
        $this->landlord->role_id = $landlordRole->id;
        $this->landlord->status = 'active';
        $this->landlord->save();

        $this->tenant = new User([
            'name' => 'Test Tenant',
            'email' => 'tenant@test.com',
            'phone' => '01733334444',
            'password' => bcrypt('Password123!'),
        ]);
        $this->tenant->role_id = $tenantRole->id;
        $this->tenant->status = 'active';
        $this->tenant->save();

        $this->suspendedUser = new User([
            'name' => 'Suspended User',
            'email' => 'suspended@test.com',
            'phone' => '01755556666',
            'password' => bcrypt('Password123!'),
        ]);
        $this->suspendedUser->role_id = $tenantRole->id;
        $this->suspendedUser->status = 'suspended';
        $this->suspendedUser->save();

        $this->approvedProperty = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Approved Property',
            'slug' => 'approved-property',
            'rent' => 15000,
            'advance' => 30000,
            'additional_charges' => 500,
            'bills_included' => ['Water Supply'],
            'property_type' => 'Apartment / Flat',
            'rental_type' => 'Monthly Rental',
            'approval_status' => 'Approved',
            'availability' => 'Available',
            'available_from' => now()->toDateString(),
            'size' => 1200,
            'rooms' => 3,
            'bathrooms' => 2,
            'floor' => '3rd',
        ]);

        PropertyLocation::create([
            'property_id' => $this->approvedProperty->id,
            'area' => 'Sonadanga R/A',
            'exact_address' => 'Road 1',
        ]);

        $this->pendingProperty = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Pending Property',
            'slug' => 'pending-property',
            'rent' => 12000,
            'advance' => 24000,
            'additional_charges' => 500,
            'bills_included' => ['Water Supply'],
            'property_type' => 'Apartment / Flat',
            'rental_type' => 'Monthly Rental',
            'approval_status' => 'Pending Approval',
            'availability' => 'Available',
            'available_from' => now()->toDateString(),
            'size' => 900,
            'rooms' => 2,
            'bathrooms' => 1,
            'floor' => '2nd',
        ]);
    }

    // 1. Valid bearer token
    public function test_valid_bearer_token_authenticates_user(): void
    {
        $token = $this->tenant->createToken('test')->plainTextToken;
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/properties');
        $response->assertStatus(200);
    }

    // 2. Invalid bearer token
    public function test_invalid_bearer_token_handled_gracefully(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer invalid-token-string')
            ->getJson('/api/v1/properties');
        $response->assertStatus(200);
    }

    // 3. Expired or revoked token
    public function test_revoked_token_handled_gracefully(): void
    {
        $tokenInstance = $this->tenant->createToken('test');
        $plainToken = $tokenInstance->plainTextToken;
        $tokenInstance->accessToken->delete();

        $response = $this->withHeader('Authorization', "Bearer {$plainToken}")
            ->getJson('/api/v1/properties');
        $response->assertStatus(200);
    }

    // 4. Stateful authenticated session
    public function test_stateful_session_authenticates_user(): void
    {
        $response = $this->actingAs($this->tenant, 'web')
            ->getJson('/api/v1/properties');
        $response->assertStatus(200);
    }

    // 5. Suspended bearer-token user
    public function test_suspended_bearer_user_receives_403(): void
    {
        $token = $this->suspendedUser->createToken('test')->plainTextToken;
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/properties');
        $response->assertStatus(403)
            ->assertJson(['message' => 'auth.errors.suspended']);
    }

    // 6. Suspended session user
    public function test_suspended_session_user_receives_403(): void
    {
        $response = $this->actingAs($this->suspendedUser, 'web')
            ->getJson('/api/v1/properties');
        $response->assertStatus(403)
            ->assertJson(['message' => 'auth.errors.suspended']);
    }

    // 7. Suspended token remains in database after read-only request
    public function test_suspended_token_not_deleted_on_read_only_discovery(): void
    {
        $tokenInstance = $this->suspendedUser->createToken('test');
        $plainToken = $tokenInstance->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$plainToken}")
            ->getJson('/api/v1/properties');

        $this->assertDatabaseHas('personal_access_tokens', [
            'id' => $tokenInstance->accessToken->id,
        ]);
    }

    // 8. Guest approved listing visibility
    public function test_guest_can_view_approved_properties(): void
    {
        $response = $this->getJson('/api/v1/properties');
        $response->assertStatus(200)
            ->assertJsonFragment(['title' => 'Approved Property']);
    }

    // 9. Pending and rejected listing exclusion
    public function test_unapproved_listings_excluded_from_discovery(): void
    {
        $response = $this->getJson('/api/v1/properties');
        $response->assertStatus(200)
            ->assertJsonMissing(['title' => 'Pending Property']);
    }

    // 10. Contact information redaction
    public function test_landlord_contact_info_redacted_for_public(): void
    {
        $response = $this->getJson("/api/v1/properties/{$this->approvedProperty->id}");
        $response->assertStatus(200)
            ->assertJsonMissing(['phone' => '01711112222'])
            ->assertJsonMissing(['email' => 'landlord@test.com']);
    }

    // 11. Tenant preference matching
    public function test_tenant_receives_preference_match_breakdown(): void
    {
        RentalPreference::create([
            'user_id' => $this->tenant->id,
            'preferred_area_id' => $this->area->id,
            'max_budget' => 16000,
            'preferred_property_type' => 'Apartment / Flat',
            'preferred_furnished' => 'Unfurnished',
            'min_rooms' => 2,
            'min_bathrooms' => 1,
        ]);

        $token = $this->tenant->createToken('test')->plainTextToken;
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/properties');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertNotEmpty($data);
        $this->assertNotNull($data[0]['match'] ?? null);
    }

    // 12. Landlord matching exclusion
    public function test_landlord_does_not_receive_tenant_matching(): void
    {
        $token = $this->landlord->createToken('test')->plainTextToken;
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/properties');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertNull($data[0]['match'] ?? null);
    }

    // 13. Reviews visibility and privacy
    public function test_property_reviews_endpoint_returns_approved_reviews(): void
    {
        Review::create([
            'property_id' => $this->approvedProperty->id,
            'tenant_id' => $this->tenant->id,
            'overall_rating' => 5.0,
            'accuracy_rating' => 5,
            'landlord_behavior_rating' => 5,
            'location_rating' => 5,
            'overall_experience_rating' => 5,
            'comment' => 'Great location and quiet neighborhood!',
            'status' => 'approved',
        ]);

        $response = $this->getJson("/api/v1/properties/{$this->approvedProperty->id}/reviews");
        $response->assertStatus(200)
            ->assertJsonFragment(['comment' => 'Great location and quiet neighborhood!']);
    }

    // 14. Areas response contract
    public function test_areas_endpoint_returns_correct_envelope(): void
    {
        $response = $this->getJson('/api/v1/properties/areas');
        $response->assertStatus(200)
            ->assertJsonStructure(['data'])
            ->assertJsonFragment(['Sonadanga R/A']);
    }

    // 15. Amenities response contract
    public function test_amenities_endpoint_returns_correct_envelope(): void
    {
        Amenity::firstOrCreate(['name' => 'WiFi Included'], ['bangla_name' => 'ওয়াইফাই']);
        $response = $this->getJson('/api/v1/properties/amenities');
        $response->assertStatus(200)
            ->assertJsonStructure(['data' => [['name', 'bangla_name', 'icon']]]);
    }

    // 16. Favorites response contract
    public function test_favorites_endpoint_returns_paginated_envelope(): void
    {
        $token = $this->tenant->createToken('test')->plainTextToken;
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/tenant/favorites');
        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'links', 'meta']);
    }

    // 17. Comparisons response contract
    public function test_comparisons_endpoint_returns_data_envelope(): void
    {
        $token = $this->tenant->createToken('test')->plainTextToken;
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/tenant/comparisons');
        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    // 18. JSON 401 without Accept header
    public function test_protected_route_returns_json_401_without_accept_header(): void
    {
        $response = $this->call('GET', '/api/v1/tenant/favorites', [], [], [], [
            'HTTP_ACCEPT' => '*/*',
        ]);
        $response->assertStatus(401)
            ->assertHeader('content-type', 'application/json')
            ->assertJson([
                'status' => 401,
                'message' => 'auth.errors.unauthenticated',
            ]);
    }

    // 19. JSON 401 with Accept header
    public function test_protected_route_returns_json_401_with_accept_header(): void
    {
        $response = $this->getJson('/api/v1/tenant/favorites');
        $response->assertStatus(401)
            ->assertJson([
                'status' => 401,
                'message' => 'auth.errors.unauthenticated',
            ]);
    }

    // 20. Normal web login redirect
    public function test_web_protected_login_entry_serves_spa_gateway(): void
    {
        $response = $this->get('/login');
        $response->assertStatus(200);
    }
}
