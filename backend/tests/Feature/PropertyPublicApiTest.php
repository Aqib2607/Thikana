<?php

namespace Tests\Feature;

use App\Models\Amenity;
use App\Models\Property;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PropertyPublicApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $landlord;
    protected User $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $landlordRole = Role::firstOrCreate(['slug' => 'landlord'], ['name' => 'Landlord', 'description' => 'Landlord']);
        $tenantRole = Role::firstOrCreate(['slug' => 'tenant'], ['name' => 'Tenant', 'description' => 'Tenant']);

        $this->landlord = new User([
            'name' => 'Public Landlord',
            'email' => 'pub_landlord@test.com',
            'phone' => '01711112222',
            'password' => bcrypt('Password123!'),
        ]);
        $this->landlord->role_id = $landlordRole->id;
        $this->landlord->status = 'active';
        $this->landlord->save();

        $this->tenant = new User([
            'name' => 'Public Tenant',
            'email' => 'pub_tenant@test.com',
            'phone' => '01733334444',
            'password' => bcrypt('Password123!'),
        ]);
        $this->tenant->role_id = $tenantRole->id;
        $this->tenant->status = 'active';
        $this->tenant->save();
    }

    /**
     * Test public area and amenity discovery endpoints.
     */
    public function test_public_can_fetch_area_and_amenity_catalogs(): void
    {
        Amenity::create(['name' => 'Test WiFi', 'bangla_name' => 'ওয়াইফাই', 'icon' => 'Wifi']);

        $resAreas = $this->getJson('/api/v1/properties/areas');
        $resAreas->assertStatus(200)
            ->assertJsonStructure(['data'])
            ->assertJsonFragment(['KUET Gate / Teligati']);

        $resAmenities = $this->getJson('/api/v1/properties/amenities');
        $resAmenities->assertStatus(200)
            ->assertJsonStructure(['data'])
            ->assertJsonFragment(['name' => 'Test WiFi']);
    }

    /**
     * Test unapproved listings are excluded from public search and direct show.
     */
    public function test_unapproved_listing_is_hidden_from_public_search(): void
    {
        $property = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Pending Approval Listing',
            'slug' => 'pending-listing-slug',
            'property_type' => 'Apartment / Flat',
            'rental_type' => 'Monthly Rental',
            'rent' => 10000,
            'advance' => 20000,
            'bills_included' => ['Water'],
            'available_from' => now()->toDateString(),
            'approval_status' => 'Pending Approval',
            'availability' => 'Available',
            'size' => 700,
            'rooms' => 2,
            'bathrooms' => 1,
            'floor' => '2nd',
        ]);

        // Search list excludes unapproved
        $resList = $this->getJson('/api/v1/properties');
        $resList->assertStatus(200);
        $this->assertCount(0, $resList->json('data'));

        // Direct show by slug returns 404 for guest
        $resShow = $this->getJson('/api/v1/properties/' . $property->slug);
        $resShow->assertStatus(404);
    }

    /**
     * Test temporarily unavailable listings are excluded from public discovery.
     */
    public function test_temporarily_unavailable_listing_is_hidden_from_public_search(): void
    {
        $property = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Unavailable Listing',
            'slug' => 'unavailable-listing-slug',
            'property_type' => 'Apartment / Flat',
            'rental_type' => 'Monthly Rental',
            'rent' => 12000,
            'advance' => 24000,
            'bills_included' => ['Water'],
            'available_from' => now()->toDateString(),
            'approval_status' => 'Approved',
            'availability' => 'Temporarily Unavailable',
            'size' => 800,
            'rooms' => 2,
            'bathrooms' => 2,
            'floor' => '3rd',
        ]);

        $resList = $this->getJson('/api/v1/properties');
        $resList->assertStatus(200);
        $this->assertCount(0, $resList->json('data'));
    }

    /**
     * Test public endpoint redacts landlord phone and email when public_contact_visible is false.
     */
    public function test_public_endpoint_redacts_landlord_contact_when_visibility_is_false(): void
    {
        $property = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Approved Listing With Private Contact',
            'slug' => 'approved-private-contact-slug',
            'property_type' => 'Apartment / Flat',
            'rental_type' => 'Monthly Rental',
            'rent' => 15000,
            'advance' => 30000,
            'bills_included' => [],
            'available_from' => now()->toDateString(),
            'approval_status' => 'Approved',
            'availability' => 'Available',
            'size' => 900,
            'rooms' => 3,
            'bathrooms' => 2,
            'floor' => '4th',
            'public_contact_visible' => false,
        ]);

        $res = $this->getJson('/api/v1/properties/' . $property->slug);
        $res->assertStatus(200);

        $this->assertFalse($res->json('data.landlord.publicContactVisible'));
        $this->assertNull($res->json('data.landlord.phone'));
        $this->assertNull($res->json('data.landlord.email'));
    }

    /**
     * Test property owner can view their own contact details even when visibility is false.
     */
    public function test_public_endpoint_reveals_landlord_contact_to_owner(): void
    {
        $property = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Approved Listing Viewed By Owner',
            'slug' => 'approved-viewed-by-owner-slug',
            'property_type' => 'Apartment / Flat',
            'rental_type' => 'Monthly Rental',
            'rent' => 15000,
            'advance' => 30000,
            'bills_included' => [],
            'available_from' => now()->toDateString(),
            'approval_status' => 'Approved',
            'availability' => 'Available',
            'size' => 900,
            'rooms' => 3,
            'bathrooms' => 2,
            'floor' => '4th',
            'public_contact_visible' => false,
        ]);

        $token = $this->landlord->createToken('test', ['role:landlord'])->plainTextToken;

        $res = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/properties/' . $property->slug);

        $res->assertStatus(200);
        $this->assertEquals($this->landlord->phone, $res->json('data.landlord.phone'));
        $this->assertEquals($this->landlord->email, $res->json('data.landlord.email'));
    }
}
