<?php

namespace Tests\Feature\Tenant;

use App\Models\Property;
use App\Models\Role;
use App\Models\User;
use App\Models\VisitRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class VisitRequestTest extends TestCase
{
    use RefreshDatabase;

    protected User $tenant;
    protected User $otherTenant;
    protected User $landlord;
    protected User $otherLandlord;
    protected Property $property;
    protected string $tenantToken;
    protected string $otherTenantToken;
    protected string $landlordToken;
    protected string $otherLandlordToken;

    protected function setUp(): void
    {
        parent::setUp();

        $tenantRole = Role::firstOrCreate(['slug' => 'tenant'], ['name' => 'Tenant', 'description' => 'Tenant Role']);
        $landlordRole = Role::firstOrCreate(['slug' => 'landlord'], ['name' => 'Landlord', 'description' => 'Landlord Role']);

        $this->tenant = new User([
            'name' => 'Arif Tenant',
            'email' => 'arif_tenant_vr@test.com',
            'phone' => '01711119999',
            'password' => bcrypt('Password123!'),
        ]);
        $this->tenant->role_id = $tenantRole->id;
        $this->tenant->status = 'active';
        $this->tenant->save();
        $this->tenantToken = $this->tenant->createToken('test', ['role:tenant'])->plainTextToken;

        $this->otherTenant = new User([
            'name' => 'Other Tenant',
            'email' => 'other_tenant_vr@test.com',
            'phone' => '01711118888',
            'password' => bcrypt('Password123!'),
        ]);
        $this->otherTenant->role_id = $tenantRole->id;
        $this->otherTenant->status = 'active';
        $this->otherTenant->save();
        $this->otherTenantToken = $this->otherTenant->createToken('test', ['role:tenant'])->plainTextToken;

        $this->landlord = new User([
            'name' => 'Kabir Landlord',
            'email' => 'kabir_landlord_vr@test.com',
            'phone' => '01722228888',
            'password' => bcrypt('Password123!'),
        ]);
        $this->landlord->role_id = $landlordRole->id;
        $this->landlord->status = 'active';
        $this->landlord->save();
        $this->landlordToken = $this->landlord->createToken('test', ['role:landlord'])->plainTextToken;

        $this->otherLandlord = new User([
            'name' => 'Other Landlord',
            'email' => 'other_landlord_vr@test.com',
            'phone' => '01733337777',
            'password' => bcrypt('Password123!'),
        ]);
        $this->otherLandlord->role_id = $landlordRole->id;
        $this->otherLandlord->status = 'active';
        $this->otherLandlord->save();
        $this->otherLandlordToken = $this->otherLandlord->createToken('test', ['role:landlord'])->plainTextToken;

        $this->property = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Quiet 2-Bed Flat Near KUET',
            'bangla_title' => 'কুয়েটের কাছে নিরিবিলি ২ রুমের ফ্ল্যাট',
            'slug' => 'quiet-2-bed-flat-vr-test',
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
    }

    public function test_unauthenticated_user_cannot_create_or_view_visits(): void
    {
        $this->postJson("/api/v1/properties/{$this->property->id}/visits", [
            'visit_date' => Carbon::tomorrow()->toDateString(),
            'preferred_time_slot' => 'morning',
        ])->assertStatus(401);

        $this->getJson('/api/v1/tenant/visits')->assertStatus(401);
        $this->getJson('/api/v1/landlord/visits')->assertStatus(401);
    }

    public function test_wrong_role_cannot_access_tenant_or_landlord_endpoints(): void
    {
        // Landlord cannot access tenant visits list
        $this->withToken($this->landlordToken)
            ->getJson('/api/v1/tenant/visits')
            ->assertStatus(403);

        // Reset auth guard cache between requests in same test
        auth('sanctum')->forgetUser();

        // Tenant cannot access landlord visits list
        $this->withToken($this->tenantToken)
            ->getJson('/api/v1/landlord/visits')
            ->assertStatus(403);
    }

    public function test_tenant_can_successfully_book_visit(): void
    {
        $tomorrow = Carbon::tomorrow()->toDateString();

        $response = $this->withToken($this->tenantToken)->postJson("/api/v1/properties/{$this->property->id}/visits", [
            'visit_date' => $tomorrow,
            'preferred_time_slot' => 'morning',
            'notes' => 'Checking water pressure and room lighting.',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'propertyId' => (string) $this->property->id,
                    'tenantId' => (string) $this->tenant->id,
                    'landlordId' => (string) $this->landlord->id,
                    'visitDate' => $tomorrow,
                    'preferredTimeSlot' => 'morning',
                    'visitTimeSlot' => 'Morning (09:00 AM - 12:00 PM)',
                    'status' => 'Pending',
                ],
            ]);

        $this->assertDatabaseHas('visit_requests', [
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'preferred_time_slot' => 'morning',
            'status' => 'pending',
        ]);
    }

    public function test_same_day_and_past_date_bookings_are_rejected(): void
    {
        // Same-day booking
        $today = Carbon::today()->toDateString();
        $resToday = $this->withToken($this->tenantToken)->postJson("/api/v1/properties/{$this->property->id}/visits", [
            'visit_date' => $today,
            'preferred_time_slot' => 'morning',
        ]);
        $resToday->assertStatus(422);

        // Past date booking
        $yesterday = Carbon::yesterday()->toDateString();
        $resPast = $this->withToken($this->tenantToken)->postJson("/api/v1/properties/{$this->property->id}/visits", [
            'visit_date' => $yesterday,
            'preferred_time_slot' => 'morning',
        ]);
        $resPast->assertStatus(422);
    }

    public function test_invalid_time_slot_rejected(): void
    {
        $response = $this->withToken($this->tenantToken)->postJson("/api/v1/properties/{$this->property->id}/visits", [
            'visit_date' => Carbon::tomorrow()->toDateString(),
            'preferred_time_slot' => 'midnight',
        ]);

        $response->assertStatus(422);
    }

    public function test_landlord_cannot_schedule_visit_on_own_property(): void
    {
        $response = $this->withToken($this->landlordToken)->postJson("/api/v1/properties/{$this->property->id}/visits", [
            'visit_date' => Carbon::tomorrow()->toDateString(),
            'preferred_time_slot' => 'morning',
        ]);

        $this->assertTrue(in_array($response->status(), [403, 422], true));
    }

    public function test_tenant_cannot_create_duplicate_active_visit_request(): void
    {
        VisitRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => Carbon::now()->addDays(3)->toDateString(),
            'preferred_time_slot' => 'morning',
            'status' => 'pending',
        ]);

        $response = $this->withToken($this->tenantToken)->postJson("/api/v1/properties/{$this->property->id}/visits", [
            'visit_date' => Carbon::now()->addDays(4)->toDateString(),
            'preferred_time_slot' => 'afternoon',
        ]);

        $response->assertStatus(422);
    }

    public function test_tenant_list_is_isolated_by_tenant_ownership(): void
    {
        VisitRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => Carbon::now()->addDays(2)->toDateString(),
            'preferred_time_slot' => 'morning',
            'status' => 'pending',
        ]);

        VisitRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->otherTenant->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => Carbon::now()->addDays(2)->toDateString(),
            'preferred_time_slot' => 'afternoon',
            'status' => 'pending',
        ]);

        $response = $this->withToken($this->tenantToken)->getJson('/api/v1/tenant/visits');
        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertCount(1, $data);
        $this->assertEquals((string) $this->tenant->id, $data[0]['tenantId']);
    }

    public function test_landlord_list_is_isolated_by_landlord_ownership(): void
    {
        VisitRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => Carbon::now()->addDays(2)->toDateString(),
            'preferred_time_slot' => 'morning',
            'status' => 'pending',
        ]);

        $response = $this->withToken($this->otherLandlordToken)->getJson('/api/v1/landlord/visits');
        $response->assertStatus(200);
        $this->assertEmpty($response->json('data'));
    }

    public function test_other_landlord_cannot_update_visit_status_idor(): void
    {
        $visit = VisitRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => Carbon::now()->addDays(2)->toDateString(),
            'preferred_time_slot' => 'morning',
            'status' => 'pending',
        ]);

        $response = $this->withToken($this->otherLandlordToken)->patchJson("/api/v1/landlord/visits/{$visit->id}/status", [
            'status' => 'accepted',
        ]);

        $response->assertStatus(403);
    }

    public function test_tenant_cannot_cancel_another_tenants_visit_idor(): void
    {
        $visit = VisitRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => Carbon::now()->addDays(3)->toDateString(),
            'preferred_time_slot' => 'morning',
            'status' => 'pending',
        ]);

        $response = $this->withToken($this->otherTenantToken)->patchJson("/api/v1/tenant/visits/{$visit->id}/cancel", [
            'cancellation_reason' => 'Unauthorized attempt',
        ]);

        $response->assertStatus(403);
    }

    public function test_tenant_can_cancel_visit_before_visit_date(): void
    {
        $visit = VisitRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => Carbon::now()->addDays(3)->toDateString(),
            'preferred_time_slot' => 'morning',
            'status' => 'pending',
        ]);

        $response = $this->withToken($this->tenantToken)->patchJson("/api/v1/tenant/visits/{$visit->id}/cancel", [
            'cancellation_reason' => 'Changed my schedule.',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => (string) $visit->id,
                    'status' => 'Cancelled',
                    'cancellationReason' => 'Changed my schedule.',
                ],
            ]);

        $this->assertDatabaseHas('visit_requests', [
            'id' => $visit->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_tenant_cannot_cancel_visit_on_scheduled_date(): void
    {
        $visit = VisitRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => Carbon::today()->toDateString(),
            'preferred_time_slot' => 'morning',
            'status' => 'pending',
        ]);

        $response = $this->withToken($this->tenantToken)->patchJson("/api/v1/tenant/visits/{$visit->id}/cancel");

        $response->assertStatus(422);
    }

    public function test_tenant_cannot_cancel_visit_after_scheduled_date(): void
    {
        $visit = VisitRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => Carbon::yesterday()->toDateString(),
            'preferred_time_slot' => 'morning',
            'status' => 'pending',
        ]);

        $response = $this->withToken($this->tenantToken)->patchJson("/api/v1/tenant/visits/{$visit->id}/cancel");

        $response->assertStatus(422);
    }

    public function test_invalid_status_transitions_are_rejected(): void
    {
        $visit = VisitRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => Carbon::now()->addDays(2)->toDateString(),
            'preferred_time_slot' => 'morning',
            'status' => 'pending',
        ]);

        // Arbitrary transition attempt
        $response = $this->withToken($this->landlordToken)->patchJson("/api/v1/landlord/visits/{$visit->id}/status", [
            'status' => 'pending',
        ]);

        $response->assertStatus(422);
    }

    public function test_pending_cannot_transition_directly_to_completed(): void
    {
        $visit = VisitRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => Carbon::now()->addDays(2)->toDateString(),
            'preferred_time_slot' => 'morning',
            'status' => 'pending',
        ]);

        $response = $this->withToken($this->landlordToken)->patchJson("/api/v1/landlord/visits/{$visit->id}/status", [
            'status' => 'completed',
        ]);

        $response->assertStatus(422);
    }

    public function test_accepted_can_transition_to_completed(): void
    {
        $visit = VisitRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => Carbon::now()->addDays(2)->toDateString(),
            'preferred_time_slot' => 'morning',
            'status' => 'accepted',
        ]);

        $response = $this->withToken($this->landlordToken)->patchJson("/api/v1/landlord/visits/{$visit->id}/status", [
            'status' => 'completed',
            'landlord_notes' => 'Visit successfully conducted.',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => (string) $visit->id,
                    'status' => 'Completed',
                    'landlordNotes' => 'Visit successfully conducted.',
                ],
            ]);

        $this->assertDatabaseHas('visit_requests', [
            'id' => $visit->id,
            'status' => 'completed',
        ]);
    }

    public function test_terminal_statuses_cannot_be_changed(): void
    {
        $completedVisit = VisitRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'visit_date' => Carbon::now()->addDays(2)->toDateString(),
            'preferred_time_slot' => 'morning',
            'status' => 'completed',
        ]);

        $response = $this->withToken($this->landlordToken)->patchJson("/api/v1/landlord/visits/{$completedVisit->id}/status", [
            'status' => 'accepted',
        ]);

        $response->assertStatus(422);
    }

    public function test_validation_responses_match_field_errors_envelope(): void
    {
        $response = $this->withToken($this->tenantToken)->postJson("/api/v1/properties/{$this->property->id}/visits", [
            'visit_date' => 'invalid-date',
            'preferred_time_slot' => '',
        ]);

        $response->assertStatus(422);
        $fieldErrors = $response->json('fieldErrors') ?? $response->json('errors') ?? [];
        $this->assertArrayHasKey('visit_date', $fieldErrors);
        $this->assertArrayHasKey('preferred_time_slot', $fieldErrors);
    }

    public function test_public_property_and_contact_request_behavior_remains_unchanged(): void
    {
        // Public property endpoint still redacts private contact details
        $propRes = $this->getJson("/api/v1/properties/{$this->property->id}");
        $propRes->assertStatus(200);
        $this->assertFalse($propRes->json('data.landlord.publicContactVisible'));
        $this->assertNull($propRes->json('data.landlord.phone'));

        // Contact request endpoint still functions normally
        $contactRes = $this->withToken($this->tenantToken)->postJson("/api/v1/properties/{$this->property->id}/contact", [
            'message' => 'Regular contact request alongside visits.',
        ]);
        $contactRes->assertStatus(201);
    }
}
