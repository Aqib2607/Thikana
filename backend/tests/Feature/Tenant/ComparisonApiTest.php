<?php

namespace Tests\Feature\Tenant;

use App\Models\Property;
use App\Models\PropertyComparison;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComparisonApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $tenant;
    protected User $otherTenant;
    protected User $landlord;
    /** @var array<int, Property> */
    protected array $properties = [];
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
            'email' => 'arif_comp@test.com',
            'phone' => '01711110003',
            'password' => bcrypt('Password123!'),
        ]);
        $this->tenant->role_id = $tenantRole->id;
        $this->tenant->status = 'active';
        $this->tenant->save();
        $this->tenantToken = $this->tenant->createToken('test', ['role:tenant'])->plainTextToken;

        $this->otherTenant = new User([
            'name' => 'Other Tenant',
            'email' => 'other_comp@test.com',
            'phone' => '01711110004',
            'password' => bcrypt('Password123!'),
        ]);
        $this->otherTenant->role_id = $tenantRole->id;
        $this->otherTenant->status = 'active';
        $this->otherTenant->save();
        $this->otherTenantToken = $this->otherTenant->createToken('test', ['role:tenant'])->plainTextToken;

        $this->landlord = new User([
            'name' => 'Kabir Landlord',
            'email' => 'kabir_comp@test.com',
            'phone' => '01722220002',
            'password' => bcrypt('Password123!'),
        ]);
        $this->landlord->role_id = $landlordRole->id;
        $this->landlord->status = 'active';
        $this->landlord->save();
        $this->landlordToken = $this->landlord->createToken('test', ['role:landlord'])->plainTextToken;

        for ($i = 1; $i <= 4; $i++) {
            $this->properties[$i] = Property::create([
                'landlord_id' => $this->landlord->id,
                'title' => "Property Listing {$i}",
                'slug' => "property-listing-comp-{$i}",
                'property_type' => 'Apartment',
                'rental_type' => 'Family Flat',
                'rent' => 10000.00 + ($i * 1000),
                'advance' => 20000.00,
                'bills_included' => [],
                'availability' => 'Available',
                'available_from' => '2026-11-01',
                'approval_status' => 'Approved',
                'size' => 750,
                'floor' => '2nd Floor',
                'rooms' => 2,
                'bathrooms' => 1,
            ]);
        }
    }

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->getJson('/api/v1/tenant/comparisons')->assertUnauthorized();
        $this->postJson('/api/v1/tenant/comparisons', ['property_id' => $this->properties[1]->id])->assertUnauthorized();
        $this->deleteJson("/api/v1/tenant/comparisons/{$this->properties[1]->id}")->assertUnauthorized();
    }

    public function test_tenant_can_add_up_to_three_properties(): void
    {
        // 1st property
        $r1 = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->postJson('/api/v1/tenant/comparisons', ['property_id' => $this->properties[1]->id]);
        $r1->assertStatus(201);

        // 2nd property
        $r2 = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->postJson('/api/v1/tenant/comparisons', ['property_id' => $this->properties[2]->id]);
        $r2->assertStatus(201);

        // 3rd property
        $r3 = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->postJson('/api/v1/tenant/comparisons', ['property_id' => $this->properties[3]->id]);
        $r3->assertStatus(201);

        $this->assertEquals(3, PropertyComparison::where('user_id', $this->tenant->id)->count());
    }

    public function test_fourth_property_is_rejected_with_422(): void
    {
        // Add 3 properties
        for ($i = 1; $i <= 3; $i++) {
            PropertyComparison::create([
                'user_id' => $this->tenant->id,
                'property_id' => $this->properties[$i]->id,
                'display_order' => $i - 1,
            ]);
        }

        // 4th property must fail
        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->postJson('/api/v1/tenant/comparisons', ['property_id' => $this->properties[4]->id]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'You can compare up to 3 properties at a time.');

        $this->assertEquals(3, PropertyComparison::where('user_id', $this->tenant->id)->count());
    }

    public function test_duplicate_addition_is_idempotent(): void
    {
        PropertyComparison::create([
            'user_id' => $this->tenant->id,
            'property_id' => $this->properties[1]->id,
            'display_order' => 0,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->postJson('/api/v1/tenant/comparisons', ['property_id' => $this->properties[1]->id]);

        $response->assertOk()
            ->assertJsonPath('message', 'Property already in comparison.');

        $this->assertEquals(1, PropertyComparison::where('user_id', $this->tenant->id)->count());
    }

    public function test_removing_item_allows_adding_another(): void
    {
        // Add 3 properties
        for ($i = 1; $i <= 3; $i++) {
            PropertyComparison::create([
                'user_id' => $this->tenant->id,
                'property_id' => $this->properties[$i]->id,
                'display_order' => $i - 1,
            ]);
        }

        // Delete property 1
        $del = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->deleteJson("/api/v1/tenant/comparisons/{$this->properties[1]->id}");
        $del->assertOk();

        $this->assertEquals(2, PropertyComparison::where('user_id', $this->tenant->id)->count());

        // Now property 4 can be added
        $add = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->postJson('/api/v1/tenant/comparisons', ['property_id' => $this->properties[4]->id]);
        $add->assertStatus(201);

        $this->assertEquals(3, PropertyComparison::where('user_id', $this->tenant->id)->count());
    }

    public function test_tenant_comparison_isolation(): void
    {
        PropertyComparison::create([
            'user_id' => $this->otherTenant->id,
            'property_id' => $this->properties[1]->id,
            'display_order' => 0,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/comparisons');

        $response->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_tenant_can_clear_all_comparisons(): void
    {
        for ($i = 1; $i <= 3; $i++) {
            PropertyComparison::create([
                'user_id' => $this->tenant->id,
                'property_id' => $this->properties[$i]->id,
                'display_order' => $i - 1,
            ]);
        }

        $this->assertEquals(3, PropertyComparison::where('user_id', $this->tenant->id)->count());

        $res = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->deleteJson('/api/v1/tenant/comparisons');

        $res->assertOk()
            ->assertJsonPath('message', 'All properties removed from comparison.');

        $this->assertEquals(0, PropertyComparison::where('user_id', $this->tenant->id)->count());
    }

    public function test_landlord_cannot_access_comparisons(): void
    {
        $this->withHeader('Authorization', "Bearer {$this->landlordToken}")
            ->getJson('/api/v1/tenant/comparisons')
            ->assertForbidden();

        $this->withHeader('Authorization', "Bearer {$this->landlordToken}")
            ->postJson('/api/v1/tenant/comparisons', ['property_id' => $this->properties[1]->id])
            ->assertForbidden();
    }
}
