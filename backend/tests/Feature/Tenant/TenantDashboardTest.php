<?php

namespace Tests\Feature\Tenant;

use App\Models\Amenity;
use App\Models\Area;
use App\Models\Conversation;
use App\Models\Favorite;
use App\Models\Message;
use App\Models\Property;
use App\Models\PropertyComparison;
use App\Models\RentalPreference;
use App\Models\Role;
use App\Models\User;
use App\Models\VisitRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected User $tenant;

    protected User $otherTenant;

    protected User $landlord;

    protected User $admin;

    protected Property $propertyA;

    protected Property $propertyB;

    protected string $tenantToken;

    protected string $otherTenantToken;

    protected string $landlordToken;

    protected string $adminToken;

    protected function setUp(): void
    {
        parent::setUp();

        $tenantRole = Role::firstOrCreate(['slug' => 'tenant'], ['name' => 'Tenant', 'description' => 'Tenant Role']);
        $landlordRole = Role::firstOrCreate(['slug' => 'landlord'], ['name' => 'Landlord', 'description' => 'Landlord Role']);
        $adminRole = Role::firstOrCreate(['slug' => 'admin'], ['name' => 'Admin', 'description' => 'Admin Role']);

        $this->tenant = new User([
            'name' => 'Test Tenant',
            'email' => 'tenant_dash@test.com',
            'phone' => '01711119001',
            'password' => bcrypt('Password123!'),
        ]);
        $this->tenant->role_id = $tenantRole->id;
        $this->tenant->status = 'active';
        $this->tenant->save();
        $this->tenantToken = $this->tenant->createToken('test', ['role:tenant'])->plainTextToken;

        $this->otherTenant = new User([
            'name' => 'Other Tenant',
            'email' => 'other_dash@test.com',
            'phone' => '01711119002',
            'password' => bcrypt('Password123!'),
        ]);
        $this->otherTenant->role_id = $tenantRole->id;
        $this->otherTenant->status = 'active';
        $this->otherTenant->save();
        $this->otherTenantToken = $this->otherTenant->createToken('test', ['role:tenant'])->plainTextToken;

        $this->landlord = new User([
            'name' => 'Test Landlord',
            'email' => 'landlord_dash@test.com',
            'phone' => '01711119003',
            'password' => bcrypt('Password123!'),
        ]);
        $this->landlord->role_id = $landlordRole->id;
        $this->landlord->status = 'active';
        $this->landlord->save();
        $this->landlordToken = $this->landlord->createToken('test', ['role:landlord'])->plainTextToken;

        $this->admin = new User([
            'name' => 'Test Admin',
            'email' => 'admin_dash@test.com',
            'phone' => '01711119004',
            'password' => bcrypt('Password123!'),
        ]);
        $this->admin->role_id = $adminRole->id;
        $this->admin->status = 'active';
        $this->admin->save();
        $this->adminToken = $this->admin->createToken('test', ['role:admin'])->plainTextToken;

        $this->propertyA = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Property Alpha',
            'slug' => 'property-alpha-dash-test',
            'property_type' => 'Apartment',
            'rental_type' => 'Family Flat',
            'rent' => 12000.00,
            'advance' => 24000.00,
            'bills_included' => [],
            'available_from' => '2026-11-01',
            'size' => 750,
            'floor' => '2nd Floor',
            'approval_status' => 'Approved',
            'availability' => 'Available',
            'rooms' => 2,
            'bathrooms' => 2,
        ]);

        $this->propertyB = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Property Beta',
            'slug' => 'property-beta-dash-test',
            'property_type' => 'Apartment',
            'rental_type' => 'Family Flat',
            'rent' => 15000.00,
            'advance' => 30000.00,
            'bills_included' => [],
            'available_from' => '2026-11-01',
            'size' => 900,
            'floor' => '3rd Floor',
            'approval_status' => 'Approved',
            'availability' => 'Available',
            'rooms' => 3,
            'bathrooms' => 2,
        ]);
    }

    // --- 1. Authentication and Authorization ---

    public function test_01_guest_receives_json_401(): void
    {
        $response = $this->getJson('/api/v1/tenant/dashboard/stats');
        $response->assertUnauthorized();
    }

    public function test_02_guest_receives_json_401_without_accept_header(): void
    {
        $response = $this->get('/api/v1/tenant/dashboard/stats');
        $response->assertUnauthorized()
            ->assertJson([
                'status' => 401,
            ]);
    }

    public function test_03_authenticated_tenant_can_access_endpoint(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');

        $response->assertOk()
            ->assertJsonStructure([
                'favoritesCount',
                'comparisonCount',
                'visitsCount',
                'conversationsCount',
                'unreadMessagesCount',
                'preferences',
            ]);
    }

    public function test_04_authenticated_landlord_receives_403(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->landlordToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');

        $response->assertForbidden();
    }

    public function test_05_authenticated_admin_receives_403(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');

        $response->assertForbidden();
    }

    // --- 2. Data Isolation ---

    public function test_06_tenant_receives_only_their_own_favorite_count(): void
    {
        Favorite::create(['user_id' => $this->tenant->id, 'property_id' => $this->propertyA->id]);
        Favorite::create(['user_id' => $this->otherTenant->id, 'property_id' => $this->propertyA->id]);
        Favorite::create(['user_id' => $this->otherTenant->id, 'property_id' => $this->propertyB->id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');
        $response->assertOk()->assertJsonPath('favoritesCount', 1);
    }

    public function test_07_tenant_receives_only_their_own_comparison_count(): void
    {
        PropertyComparison::create(['user_id' => $this->tenant->id, 'property_id' => $this->propertyA->id, 'display_order' => 1]);
        PropertyComparison::create(['user_id' => $this->otherTenant->id, 'property_id' => $this->propertyB->id, 'display_order' => 1]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');
        $response->assertOk()->assertJsonPath('comparisonCount', 1);
    }

    public function test_08_tenant_receives_only_their_own_visit_count(): void
    {
        VisitRequest::create([
            'property_id' => $this->propertyA->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => now()->addDays(2),
            'preferred_time_slot' => 'morning',
            'status' => 'pending',
        ]);
        VisitRequest::create([
            'property_id' => $this->propertyB->id,
            'tenant_id' => $this->otherTenant->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => now()->addDays(3),
            'preferred_time_slot' => 'morning',
            'status' => 'pending',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');
        $response->assertOk()->assertJsonPath('visitsCount', 1);
    }

    public function test_09_tenant_receives_only_their_own_conversation_count(): void
    {
        Conversation::create([
            'property_id' => $this->propertyA->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'last_message' => 'Hello',
            'last_message_at' => now(),
        ]);
        Conversation::create([
            'property_id' => $this->propertyB->id,
            'tenant_id' => $this->otherTenant->id,
            'landlord_id' => $this->landlord->id,
            'last_message' => 'Hello Other',
            'last_message_at' => now(),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');
        $response->assertOk()->assertJsonPath('conversationsCount', 1);
    }

    public function test_10_tenant_receives_only_their_own_unread_message_count(): void
    {
        $convTenant = Conversation::create([
            'property_id' => $this->propertyA->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'last_message' => 'Msg 1',
            'last_message_at' => now(),
        ]);
        Message::create([
            'conversation_id' => $convTenant->id,
            'sender_id' => $this->landlord->id,
            'text' => 'Unread for tenant',
            'read_at' => null,
        ]);

        $convOther = Conversation::create([
            'property_id' => $this->propertyB->id,
            'tenant_id' => $this->otherTenant->id,
            'landlord_id' => $this->landlord->id,
            'last_message' => 'Msg 2',
            'last_message_at' => now(),
        ]);
        Message::create([
            'conversation_id' => $convOther->id,
            'sender_id' => $this->landlord->id,
            'text' => 'Unread for other tenant',
            'read_at' => null,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');
        $response->assertOk()->assertJsonPath('unreadMessagesCount', 1);
    }

    public function test_11_tenant_cannot_receive_another_tenants_preferences(): void
    {
        RentalPreference::create([
            'user_id' => $this->otherTenant->id,
            'max_budget' => 20000.00,
            'min_rooms' => 3,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');
        $response->assertOk()->assertJsonPath('preferences', null);
    }

    // --- 3. Count Correctness ---

    public function test_12_empty_records_return_zero_counts(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');

        $response->assertOk()->assertJson([
            'favoritesCount' => 0,
            'comparisonCount' => 0,
            'visitsCount' => 0,
            'conversationsCount' => 0,
            'unreadMessagesCount' => 0,
            'preferences' => null,
        ]);
    }

    public function test_13_pending_visits_count(): void
    {
        VisitRequest::create([
            'property_id' => $this->propertyA->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => now()->addDays(1),
            'preferred_time_slot' => 'morning',
            'status' => 'pending',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');
        $response->assertOk()->assertJsonPath('visitsCount', 1);
    }

    public function test_14_accepted_visits_count(): void
    {
        VisitRequest::create([
            'property_id' => $this->propertyA->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => now()->addDays(2),
            'preferred_time_slot' => 'afternoon',
            'status' => 'accepted',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');
        $response->assertOk()->assertJsonPath('visitsCount', 1);
    }

    public function test_15_rejected_visits_do_not_count(): void
    {
        VisitRequest::create([
            'property_id' => $this->propertyA->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => now()->addDays(1),
            'preferred_time_slot' => 'morning',
            'status' => 'rejected',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');
        $response->assertOk()->assertJsonPath('visitsCount', 0);
    }

    public function test_16_cancelled_visits_do_not_count(): void
    {
        VisitRequest::create([
            'property_id' => $this->propertyA->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => now()->addDays(1),
            'preferred_time_slot' => 'evening',
            'status' => 'cancelled',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');
        $response->assertOk()->assertJsonPath('visitsCount', 0);
    }

    public function test_17_completed_visits_do_not_count(): void
    {
        VisitRequest::create([
            'property_id' => $this->propertyA->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => now()->subDays(1),
            'preferred_time_slot' => 'morning',
            'status' => 'completed',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');
        $response->assertOk()->assertJsonPath('visitsCount', 0);
    }

    public function test_18_conversations_count_without_assuming_status_column(): void
    {
        Conversation::create([
            'property_id' => $this->propertyA->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'last_message' => 'First conversation',
            'last_message_at' => now(),
        ]);
        Conversation::create([
            'property_id' => $this->propertyB->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'last_message' => 'Second conversation',
            'last_message_at' => now(),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');
        $response->assertOk()->assertJsonPath('conversationsCount', 2);
    }

    public function test_19_incoming_unread_messages_count(): void
    {
        $conv = Conversation::create([
            'property_id' => $this->propertyA->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'last_message' => 'Incoming',
            'last_message_at' => now(),
        ]);

        Message::create([
            'conversation_id' => $conv->id,
            'sender_id' => $this->landlord->id,
            'text' => 'Incoming message 1',
            'read_at' => null,
        ]);
        Message::create([
            'conversation_id' => $conv->id,
            'sender_id' => $this->landlord->id,
            'text' => 'Incoming message 2',
            'read_at' => null,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');
        $response->assertOk()->assertJsonPath('unreadMessagesCount', 2);
    }

    public function test_20_outgoing_messages_do_not_count(): void
    {
        $conv = Conversation::create([
            'property_id' => $this->propertyA->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'last_message' => 'Outgoing',
            'last_message_at' => now(),
        ]);

        Message::create([
            'conversation_id' => $conv->id,
            'sender_id' => $this->tenant->id,
            'text' => 'Outgoing message from tenant',
            'read_at' => null,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');
        $response->assertOk()->assertJsonPath('unreadMessagesCount', 0);
    }

    public function test_21_read_messages_do_not_count(): void
    {
        $conv = Conversation::create([
            'property_id' => $this->propertyA->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'last_message' => 'Read',
            'last_message_at' => now(),
        ]);

        Message::create([
            'conversation_id' => $conv->id,
            'sender_id' => $this->landlord->id,
            'text' => 'Read message',
            'read_at' => now(),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');
        $response->assertOk()->assertJsonPath('unreadMessagesCount', 0);
    }

    public function test_22_messages_in_unrelated_conversations_do_not_count(): void
    {
        $convOther = Conversation::create([
            'property_id' => $this->propertyB->id,
            'tenant_id' => $this->otherTenant->id,
            'landlord_id' => $this->landlord->id,
            'last_message' => 'Other',
            'last_message_at' => now(),
        ]);

        Message::create([
            'conversation_id' => $convOther->id,
            'sender_id' => $this->landlord->id,
            'text' => 'Message to other tenant',
            'read_at' => null,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');
        $response->assertOk()->assertJsonPath('unreadMessagesCount', 0);
    }

    // --- 4. Preferences ---

    public function test_23_existing_tenant_preferences_are_returned(): void
    {
        $area = Area::create([
            'name' => 'Sonadanga',
            'bangla_name' => 'সোনাডাঙ্গা',
        ]);

        $amenity = Amenity::create([
            'name' => 'Generator / IPS Backup',
            'bangla_name' => 'জেনারেটর / আইপিএস ব্যাকআপ',
        ]);

        $pref = RentalPreference::create([
            'user_id' => $this->tenant->id,
            'preferred_area_id' => $area->id,
            'max_budget' => 15000.00,
            'preferred_property_type' => 'Apartment',
            'min_rooms' => 2,
            'min_bathrooms' => 2,
            'preferred_furnished' => 'Semi-Furnished',
        ]);
        $pref->amenities()->attach($amenity->id);

        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');

        $response->assertOk()
            ->assertJsonPath('preferences.preferredArea', 'Sonadanga')
            ->assertJsonPath('preferences.maxBudget', 15000)
            ->assertJsonPath('preferences.preferredPropertyType', 'Apartment')
            ->assertJsonPath('preferences.minRooms', 2)
            ->assertJsonPath('preferences.minBathrooms', 2)
            ->assertJsonPath('preferences.preferredFurnished', 'Semi-Furnished')
            ->assertJsonPath('preferences.hasMeaningfulPreferences', true);
    }

    public function test_24_missing_tenant_preferences_return_null(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->tenantToken}")
            ->getJson('/api/v1/tenant/dashboard/stats');

        $response->assertOk()
            ->assertJsonPath('preferences', null);
    }
}
