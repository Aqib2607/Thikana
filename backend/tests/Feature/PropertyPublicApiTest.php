<?php

namespace Tests\Feature;

use App\Models\Amenity;
use App\Models\Area;
use App\Models\Property;
use App\Models\PropertyVerification;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PropertyPublicApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $landlord;
    protected User $tenant;
    protected User $admin;
    protected User $suspendedUser;

    protected function setUp(): void
    {
        parent::setUp();

        $landlordRole = Role::firstOrCreate(['slug' => 'landlord'], ['name' => 'Landlord', 'description' => 'Landlord']);
        $tenantRole = Role::firstOrCreate(['slug' => 'tenant'], ['name' => 'Tenant', 'description' => 'Tenant']);
        $adminRole = Role::firstOrCreate(['slug' => 'admin'], ['name' => 'Admin', 'description' => 'Administrator']);

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

        $this->admin = new User([
            'name' => 'Platform Admin',
            'email' => 'pub_admin@test.com',
            'phone' => '01755556666',
            'password' => bcrypt('Password123!'),
        ]);
        $this->admin->role_id = $adminRole->id;
        $this->admin->status = 'active';
        $this->admin->save();

        $this->suspendedUser = new User([
            'name' => 'Suspended Tenant',
            'email' => 'suspended_tenant@test.com',
            'phone' => '01777778888',
            'password' => bcrypt('Password123!'),
        ]);
        $this->suspendedUser->role_id = $tenantRole->id;
        $this->suspendedUser->status = 'suspended';
        $this->suspendedUser->save();
    }

    /**
     * Test public area and amenity discovery endpoints remain accessible to guests.
     */
    public function test_public_can_fetch_area_and_amenity_catalogs(): void
    {
        Area::create(['name' => 'KUET Gate / Teligati', 'bangla_name' => 'কুয়েট গেট / তেলিগাতী', 'display_order' => 1]);
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
     * Test guests can access approved property search and details under ADR-01.1.
     */
    public function test_guest_cannot_access_property_search_or_details(): void
    {
        $property = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Approved Listing for Guest Test',
            'slug' => 'approved-listing-guest-test',
            'property_type' => 'Apartment / Flat',
            'rental_type' => 'Monthly Rental',
            'rent' => 10000,
            'advance' => 20000,
            'bills_included' => ['Water'],
            'available_from' => now()->toDateString(),
            'approval_status' => 'Approved',
            'availability' => 'Available',
            'size' => 700,
            'rooms' => 2,
            'bathrooms' => 1,
            'floor' => '2nd',
        ]);

        $this->getJson('/api/v1/properties')
            ->assertStatus(200)
            ->assertJsonStructure(['data']);

        $this->getJson('/api/v1/properties/' . $property->slug)
            ->assertStatus(200)
            ->assertJsonPath('data.slug', $property->slug);
    }

    /**
     * Test suspended user receives 403 when attempting to access property discovery.
     */
    public function test_suspended_user_cannot_access_property_discovery(): void
    {
        $token = $this->suspendedUser->createToken('test', ['role:tenant'])->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/properties')
            ->assertStatus(403)
            ->assertJson(['message' => 'auth.errors.suspended']);
    }

    /**
     * Test active tenants, landlords, and administrators can search properties.
     */
    public function test_authenticated_roles_can_access_property_discovery(): void
    {
        Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Approved Listing for Roles Test',
            'slug' => 'approved-listing-roles-test',
            'property_type' => 'Apartment / Flat',
            'rental_type' => 'Monthly Rental',
            'rent' => 12000,
            'advance' => 24000,
            'bills_included' => ['Water'],
            'available_from' => now()->toDateString(),
            'approval_status' => 'Approved',
            'availability' => 'Available',
            'size' => 750,
            'rooms' => 2,
            'bathrooms' => 1,
            'floor' => '1st',
        ]);

        $tenantToken = $this->tenant->createToken('test', ['role:tenant'])->plainTextToken;
        $this->withHeader('Authorization', 'Bearer ' . $tenantToken)
            ->getJson('/api/v1/properties')
            ->assertStatus(200)
            ->assertJsonStructure(['data', 'total', 'page', 'limit']);

        $landlordToken = $this->landlord->createToken('test', ['role:landlord'])->plainTextToken;
        $this->withHeader('Authorization', 'Bearer ' . $landlordToken)
            ->getJson('/api/v1/properties')
            ->assertStatus(200);

        $adminToken = $this->admin->createToken('test', ['role:admin'])->plainTextToken;
        $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->getJson('/api/v1/properties')
            ->assertStatus(200);
    }

    /**
     * Test unapproved listings are excluded from tenant search and direct show.
     */
    public function test_unapproved_listing_is_hidden_from_tenant_search(): void
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

        $tenantToken = $this->tenant->createToken('test', ['role:tenant'])->plainTextToken;

        // Search list excludes unapproved for tenant
        $resList = $this->withHeader('Authorization', 'Bearer ' . $tenantToken)
            ->getJson('/api/v1/properties');
        $resList->assertStatus(200);
        $this->assertCount(0, $resList->json('data'));

        // Direct show by slug returns 404 for tenant
        $resShow = $this->withHeader('Authorization', 'Bearer ' . $tenantToken)
            ->getJson('/api/v1/properties/' . $property->slug);
        $resShow->assertStatus(404);

        // Direct show returns 200 for owner landlord
        app('auth')->forgetGuards();
        $landlordToken = $this->landlord->createToken('test', ['role:landlord'])->plainTextToken;
        $resLandlord = $this->withHeader('Authorization', 'Bearer ' . $landlordToken)
            ->getJson('/api/v1/properties/' . $property->slug);
        $resLandlord->assertStatus(200);
    }

    /**
     * Test temporarily unavailable listings are excluded from discovery search.
     */
    public function test_temporarily_unavailable_listing_is_hidden_from_search(): void
    {
        Property::create([
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

        $tenantToken = $this->tenant->createToken('test', ['role:tenant'])->plainTextToken;

        $resList = $this->withHeader('Authorization', 'Bearer ' . $tenantToken)
            ->getJson('/api/v1/properties');
        $resList->assertStatus(200);
        $this->assertCount(0, $resList->json('data'));
    }

    /**
     * Test endpoint redacts landlord phone and email when public_contact_visible is false.
     */
    public function test_endpoint_redacts_landlord_contact_when_visibility_is_false(): void
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

        $tenantToken = $this->tenant->createToken('test', ['role:tenant'])->plainTextToken;

        $res = $this->withHeader('Authorization', 'Bearer ' . $tenantToken)
            ->getJson('/api/v1/properties/' . $property->slug);
        $res->assertStatus(200);

        $this->assertFalse($res->json('data.landlord.publicContactVisible'));
        $this->assertNull($res->json('data.landlord.phone'));
        $this->assertNull($res->json('data.landlord.email'));
    }

    /**
     * Test property owner can view their own contact details even when visibility is false.
     */
    public function test_endpoint_reveals_landlord_contact_to_owner(): void
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

    /**
     * Test search validation rules reject invalid input with 422 Unprocessable Entity.
     */
    public function test_search_query_validation_enforces_parameter_rules(): void
    {
        $token = $this->tenant->createToken('test', ['role:tenant'])->plainTextToken;

        // Negative rent
        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/properties?minRent=-100')
            ->assertStatus(422)
            ->assertJsonStructure(['fieldErrors' => ['minRent']]);

        // maxRent < minRent
        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/properties?minRent=10000&maxRent=5000')
            ->assertStatus(422)
            ->assertJsonStructure(['fieldErrors' => ['maxRent']]);

        // Invalid property type
        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/properties?propertyType=Palace')
            ->assertStatus(422)
            ->assertJsonStructure(['fieldErrors' => ['propertyType']]);

        // Invalid limit
        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/properties?limit=999')
            ->assertStatus(422)
            ->assertJsonStructure(['fieldErrors' => ['limit']]);

        // Invalid sortBy
        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/properties?sortBy=sql_injection')
            ->assertStatus(422)
            ->assertJsonStructure(['fieldErrors' => ['sortBy']]);
    }

    /**
     * Test verifiedOnly filter returns only properties having verified verifications.
     */
    public function test_search_verified_only_filter_applies_correctly(): void
    {
        $verifiedProp = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Verified Listing',
            'slug' => 'verified-listing',
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
        ]);

        PropertyVerification::create([
            'property_id' => $verifiedProp->id,
            'verification_type' => 'Owner Identity Verified',
            'verified_by' => $this->admin->id,
        ]);

        Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Unverified Listing',
            'slug' => 'unverified-listing',
            'property_type' => 'Apartment / Flat',
            'rental_type' => 'Monthly Rental',
            'rent' => 14000,
            'advance' => 28000,
            'bills_included' => [],
            'available_from' => now()->toDateString(),
            'approval_status' => 'Approved',
            'availability' => 'Available',
            'size' => 850,
            'rooms' => 3,
            'bathrooms' => 2,
            'floor' => '2nd',
        ]);

        $token = $this->tenant->createToken('test', ['role:tenant'])->plainTextToken;

        // verifiedOnly = 1 returns only the verified listing
        $res = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/properties?verifiedOnly=1');

        $res->assertStatus(200);
        $this->assertCount(1, $res->json('data'));
        $this->assertEquals('Verified Listing', $res->json('data.0.title'));
    }

    /**
     * Test User::properties() inverse relationship returns only listings for that landlord.
     */
    public function test_user_properties_relationship_returns_only_own_listings(): void
    {
        $otherLandlord = new User([
            'name' => 'Other Landlord',
            'email' => 'other_landlord@test.com',
            'phone' => '01799990000',
            'password' => bcrypt('Password123!'),
        ]);
        $otherLandlord->role_id = $this->landlord->role_id;
        $otherLandlord->status = 'active';
        $otherLandlord->save();

        $prop1 = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'My Property 1',
            'slug' => 'my-property-1',
            'property_type' => 'Apartment / Flat',
            'rental_type' => 'Monthly Rental',
            'rent' => 10000,
            'advance' => 20000,
            'bills_included' => [],
            'available_from' => now()->toDateString(),
            'approval_status' => 'Approved',
            'availability' => 'Available',
            'size' => 700,
            'rooms' => 2,
            'bathrooms' => 1,
            'floor' => '1st',
        ]);

        $prop2 = Property::create([
            'landlord_id' => $otherLandlord->id,
            'title' => 'Other Landlord Property',
            'slug' => 'other-property',
            'property_type' => 'Apartment / Flat',
            'rental_type' => 'Monthly Rental',
            'rent' => 11000,
            'advance' => 22000,
            'bills_included' => [],
            'available_from' => now()->toDateString(),
            'approval_status' => 'Approved',
            'availability' => 'Available',
            'size' => 700,
            'rooms' => 2,
            'bathrooms' => 1,
            'floor' => '1st',
        ]);

        $this->assertTrue($this->landlord->properties->contains('id', $prop1->id));
        $this->assertFalse($this->landlord->properties->contains('id', $prop2->id));
        $this->assertCount(1, $this->landlord->properties);
    }
}
