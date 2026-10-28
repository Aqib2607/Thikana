<?php

namespace Tests\Feature\Tenant;

use App\Models\ContactRequest;
use App\Models\Property;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactRequestTest extends TestCase
{
    use RefreshDatabase;

    protected User $tenant;
    protected User $landlord;
    protected User $otherLandlord;
    protected Property $property;
    protected string $tenantToken;
    protected string $landlordToken;
    protected string $otherLandlordToken;

    protected function setUp(): void
    {
        parent::setUp();

        $tenantRole = Role::firstOrCreate(['slug' => 'tenant'], ['name' => 'Tenant', 'description' => 'Tenant Role']);
        $landlordRole = Role::firstOrCreate(['slug' => 'landlord'], ['name' => 'Landlord', 'description' => 'Landlord Role']);

        $this->tenant = new User([
            'name' => 'Arif Tenant',
            'email' => 'arif_tenant@test.com',
            'phone' => '01711119999',
            'password' => bcrypt('Password123!'),
        ]);
        $this->tenant->role_id = $tenantRole->id;
        $this->tenant->status = 'active';
        $this->tenant->save();
        $this->tenantToken = $this->tenant->createToken('test', ['role:tenant'])->plainTextToken;

        $this->landlord = new User([
            'name' => 'Kabir Landlord',
            'email' => 'kabir_landlord@test.com',
            'phone' => '01722228888',
            'password' => bcrypt('Password123!'),
        ]);
        $this->landlord->role_id = $landlordRole->id;
        $this->landlord->status = 'active';
        $this->landlord->save();
        $this->landlordToken = $this->landlord->createToken('test', ['role:landlord'])->plainTextToken;

        $this->otherLandlord = new User([
            'name' => 'Other Landlord',
            'email' => 'other_landlord@test.com',
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
            'slug' => 'quiet-2-bed-flat-near-kuet-test',
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

    public function test_unauthenticated_user_cannot_send_contact_request(): void
    {
        $response = $this->postJson("/api/v1/properties/{$this->property->id}/contact", [
            'message' => 'Hello, I am interested in this flat.',
        ]);

        $response->assertStatus(401);
    }

    public function test_tenant_can_successfully_send_contact_request(): void
    {
        $response = $this->withToken($this->tenantToken)->postJson("/api/v1/properties/{$this->property->id}/contact", [
            'message' => 'Hello Kabir, I want to rent this property from November.',
            'phone' => '01711119999',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'propertyId' => (string) $this->property->id,
                    'tenantId' => (string) $this->tenant->id,
                    'landlordId' => (string) $this->landlord->id,
                    'status' => 'Pending',
                    'landlordContact' => null,
                ],
            ]);

        $this->assertDatabaseHas('contact_requests', [
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'status' => 'pending',
        ]);
    }

    public function test_validation_rejects_empty_or_too_short_message(): void
    {
        $response = $this->withToken($this->tenantToken)->postJson("/api/v1/properties/{$this->property->id}/contact", [
            'message' => 'Hey',
        ]);

        $response->assertStatus(422);
        $fieldErrors = $response->json('fieldErrors') ?? $response->json('errors') ?? [];
        $this->assertArrayHasKey('message', $fieldErrors);
    }

    public function test_landlord_cannot_send_contact_request_on_own_property(): void
    {
        $response = $this->withToken($this->landlordToken)->postJson("/api/v1/properties/{$this->property->id}/contact", [
            'message' => 'Trying to contact myself about this property.',
        ]);

        // Either blocked by role middleware (403) or after-validator check (422)
        $this->assertTrue(in_array($response->status(), [403, 422], true));
    }

    public function test_landlord_can_view_and_accept_contact_request(): void
    {
        $contactRequest = ContactRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'message' => 'Initial tenant message',
            'phone' => '01711119999',
            'status' => 'pending',
        ]);

        $indexRes = $this->withToken($this->landlordToken)->getJson('/api/v1/landlord/contact-requests');
        $indexRes->assertStatus(200)
            ->assertJsonStructure(['data' => [['id', 'propertyId', 'tenantId', 'status']]]);

        $patchRes = $this->withToken($this->landlordToken)->patchJson("/api/v1/landlord/contact-requests/{$contactRequest->id}/status", [
            'status' => 'accepted',
            'landlord_note' => 'You can call me anytime.',
        ]);

        $patchRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => (string) $contactRequest->id,
                    'status' => 'Accepted',
                    'landlordNote' => 'You can call me anytime.',
                ],
            ]);

        $this->assertDatabaseHas('contact_requests', [
            'id' => $contactRequest->id,
            'status' => 'accepted',
            'landlord_note' => 'You can call me anytime.',
        ]);
    }

    public function test_other_landlord_cannot_modify_contact_request_idor_defense(): void
    {
        $contactRequest = ContactRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'message' => 'Initial tenant message',
            'phone' => '01711119999',
            'status' => 'pending',
        ]);

        $response = $this->withToken($this->otherLandlordToken)->patchJson("/api/v1/landlord/contact-requests/{$contactRequest->id}/status", [
            'status' => 'accepted',
        ]);

        $response->assertStatus(403);
    }

    public function test_tenant_sees_landlord_contact_info_only_when_accepted(): void
    {
        $contactRequest = ContactRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'message' => 'Inquiring about flat',
            'phone' => '01711119999',
            'status' => 'pending',
        ]);

        // When status is pending: landlord contact MUST be null
        $pendingRes = $this->withToken($this->tenantToken)->getJson('/api/v1/tenant/contact-requests');
        $pendingRes->assertStatus(200);
        $this->assertNull($pendingRes->json('data.0.landlordContact'));

        // When landlord accepts: landlord contact info is disclosed to THIS tenant
        $contactRequest->update(['status' => 'accepted', 'responded_at' => now()]);

        $acceptedRes = $this->withToken($this->tenantToken)->getJson('/api/v1/tenant/contact-requests');
        $acceptedRes->assertStatus(200);
        $this->assertEquals($this->landlord->phone, $acceptedRes->json('data.0.landlordContact.phone'));
        $this->assertEquals($this->landlord->email, $acceptedRes->json('data.0.landlordContact.email'));
    }

    public function test_public_property_endpoint_does_not_leak_private_contact(): void
    {
        $response = $this->getJson("/api/v1/properties/{$this->property->id}");

        $response->assertStatus(200);
        $this->assertFalse($response->json('data.landlord.publicContactVisible'));
        $this->assertNull($response->json('data.landlord.phone'));
        $this->assertNull($response->json('data.landlord.email'));
    }
}
