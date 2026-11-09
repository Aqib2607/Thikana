<?php

namespace Tests\Feature\Tenant;

use App\Models\Favorite;
use App\Models\Property;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FavoriteApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $tenant;
    protected User $otherTenant;
    protected User $landlord;
    protected Property $property;
    protected Property $unapprovedProperty;
    protected string $tenantToken;
    protected string $otherTenantToken;
    protected string $landlordToken;

    protected function setUp(): void
    {
        parent::setUp();

        $tenantRole = Role::firstOrCreate(['slug' => 'tenant'], ['name' => 'Tenant', 'description' => 'Tenant Role']);
        $landlordRole = Role::firstOrCreate(['slug' => 'landlord'], ['name' => 'Landlord', 'description' => 'Landlord Role']);

        $this->tenant = new User([
            'name' => 'Arif Tenant',
            'email' => 'arif_fav@test.com',
            'phone' => '01711110001',
            'password' => bcrypt('Password123!'),
        ]);
        $this->tenant->role_id = $tenantRole->id;
        $this->tenant->status = 'active';
        $this->tenant->save();
        $this->tenantToken = $this->tenant->createToken('test', ['role:tenant'])->plainTextToken;

        $this->otherTenant = new User([
            'name' => 'Other Tenant',
            'email' => 'other_fav@test.com',
            'phone' => '01711110002',
            'password' => bcrypt('Password123!'),
        ]);
        $this->otherTenant->role_id = $tenantRole->id;
        $this->otherTenant->status = 'active';
        $this->otherTenant->save();
        $this->otherTenantToken = $this->otherTenant->createToken('test', ['role:tenant'])->plainTextToken;

        $this->landlord = new User([
            'name' => 'Kabir Landlord',
            'email' => 'kabir_fav@test.com',
            'phone' => '01722220001',
            'password' => bcrypt('Password123!'),
        ]);
        $this->landlord->role_id = $landlordRole->id;
        $this->landlord->status = 'active';
        $this->landlord->save();
        $this->landlordToken = $this->landlord->createToken('test', ['role:landlord'])->plainTextToken;

        $this->property = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Quiet 2-Bed Flat Near KUET',
            'bangla_title' => 'কুয়েটের কাছে নিরিবিলি ২ রুমের ফ্ল্যাট',
            'slug' => 'quiet-2-bed-flat-near-kuet-fav-test',
            'property_type' => 'Apartment',
            'rental_type' => 'Family Flat',
            'rent' => 12000.00,
            'advance' => 24000.00,
            'additional_charges' => 1000.00,
            'bills_included' => ['Water Supply'],
            'availability' => 'Available',
            'available_from' => '2026-11-01',
            'approval_status' => 'Approved',
            'size' => 850,
            'rooms' => 2,
            'bathrooms' => 2,
            'balconies' => 1,
            'floor' => '2nd Floor',
            'total_floors' => 5,
            'furnished_status' => 'Unfurnished',
            'preferred_tenant' => 'Families Only',
            'public_contact_visible' => false,
            'community_info' => [],
            'rating' => 0.0,
            'review_count' => 0,
        ]);

        $this->unapprovedProperty = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Pending Listing',
            'slug' => 'pending-listing-fav-test',
            'property_type' => 'Apartment',
            'rental_type' => 'Family Flat',
            'rent' => 10000.00,
            'bills_included' => [],
            'availability' => 'Available',
            'available_from' => '2026-11-01',
            'approval_status' => 'Pending',
            'size' => 650,
            'floor' => '1st Floor',
            'rooms' => 2,
            'bathrooms' => 1,
        ]);
    }

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->getJson('/api/v1/tenant/favorites')->assertUnauthorized();
        $this->postJson('/api/v1/tenant/favorites', ['property_id' => $this->property->id])->assertUnauthorized();
        $this->deleteJson("/api/v1/tenant/favorites/{$this->property->id}")->assertUnauthorized();
    }

    public function test_tenant_can_add_favorite_idempotently(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->postJson('/api/v1/tenant/favorites', ['property_id' => $this->property->id]);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Property added to favorites.');

        $this->assertDatabaseHas('favorites', [
            'user_id' => $this->tenant->id,
            'property_id' => $this->property->id,
        ]);

        // Duplicate addition should be idempotent (does not fail or duplicate)
        $dupResponse = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->postJson('/api/v1/tenant/favorites', ['property_id' => $this->property->id]);

        $dupResponse->assertStatus(201);
        $this->assertEquals(1, Favorite::where('user_id', $this->tenant->id)->count());
    }

    public function test_tenant_can_list_favorites(): void
    {
        Favorite::create([
            'user_id' => $this->tenant->id,
            'property_id' => $this->property->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/favorites');

        $response->assertOk()
            ->assertJsonPath('data.0.id', (string) $this->property->id);
    }

    public function test_tenant_cannot_favorite_unapproved_property(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->postJson('/api/v1/tenant/favorites', ['property_id' => $this->unapprovedProperty->id]);

        $response->assertNotFound();
    }

    public function test_tenant_can_remove_favorite(): void
    {
        Favorite::create([
            'user_id' => $this->tenant->id,
            'property_id' => $this->property->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->deleteJson("/api/v1/tenant/favorites/{$this->property->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('favorites', [
            'user_id' => $this->tenant->id,
            'property_id' => $this->property->id,
        ]);
    }

    public function test_landlord_cannot_access_tenant_favorites(): void
    {
        $this->withHeader('Authorization', "Bearer {$this->landlordToken}")
            ->getJson('/api/v1/tenant/favorites')
            ->assertForbidden();

        $this->withHeader('Authorization', "Bearer {$this->landlordToken}")
            ->postJson('/api/v1/tenant/favorites', ['property_id' => $this->property->id])
            ->assertForbidden();
    }

    public function test_suspended_tenant_cannot_mutate_favorites(): void
    {
        $this->tenant->status = 'suspended';
        $this->tenant->save();

        $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->postJson('/api/v1/tenant/favorites', ['property_id' => $this->property->id])
            ->assertForbidden();
    }

    public function test_tenant_isolation_in_favorites(): void
    {
        Favorite::create([
            'user_id' => $this->otherTenant->id,
            'property_id' => $this->property->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/favorites');

        $response->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
