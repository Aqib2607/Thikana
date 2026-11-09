<?php

namespace Tests\Feature;

use App\Models\ContactRequest;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Property;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessagingAndNotificationTest extends TestCase
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
            'email' => 'arif@thikana.test',
            'phone' => '01711112222',
            'password' => bcrypt('Password123!'),
        ]);
        $this->tenant->role_id = $tenantRole->id;
        $this->tenant->status = 'active';
        $this->tenant->save();
        $this->tenantToken = $this->tenant->createToken('tenant', ['role:tenant'])->plainTextToken;

        $this->otherTenant = new User([
            'name' => 'Kamal Other Tenant',
            'email' => 'kamal@thikana.test',
            'phone' => '01711113333',
            'password' => bcrypt('Password123!'),
        ]);
        $this->otherTenant->role_id = $tenantRole->id;
        $this->otherTenant->status = 'active';
        $this->otherTenant->save();
        $this->otherTenantToken = $this->otherTenant->createToken('other_tenant', ['role:tenant'])->plainTextToken;

        $this->landlord = new User([
            'name' => 'Rafiq Landlord',
            'email' => 'rafiq@thikana.test',
            'phone' => '01722223333',
            'password' => bcrypt('Password123!'),
        ]);
        $this->landlord->role_id = $landlordRole->id;
        $this->landlord->status = 'active';
        $this->landlord->save();
        $this->landlordToken = $this->landlord->createToken('landlord', ['role:landlord'])->plainTextToken;

        $this->otherLandlord = new User([
            'name' => 'Mustafa Other Landlord',
            'email' => 'mustafa@thikana.test',
            'phone' => '01722224444',
            'password' => bcrypt('Password123!'),
        ]);
        $this->otherLandlord->role_id = $landlordRole->id;
        $this->otherLandlord->status = 'active';
        $this->otherLandlord->save();
        $this->otherLandlordToken = $this->otherLandlord->createToken('other_landlord', ['role:landlord'])->plainTextToken;

        $this->property = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Charming 2-Bed in Boyra',
            'bangla_title' => 'বয়রায় মনোরম ২ বেডের ফ্ল্যাট',
            'slug' => 'charming-2-bed-in-boyra',
            'property_type' => 'Apartment',
            'rental_type' => 'Monthly Rental',
            'rent' => 12000.00,
            'advance' => 24000.00,
            'additional_charges' => 1500.00,
            'bills_included' => ['Water'],
            'availability' => 'Available',
            'available_from' => '2026-12-01',
            'approval_status' => 'Approved',
            'size' => 950,
            'rooms' => 2,
            'bathrooms' => 2,
            'balconies' => 1,
            'floor' => '3rd Floor',
            'total_floors' => 5,
            'furnished_status' => 'Unfurnished',
            'preferred_tenant' => 'Any',
        ]);
    }

    public function test_contact_request_submission_notifies_landlord_and_enforces_concurrency_guard(): void
    {
        // 1. Tenant submits contact request
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->tenantToken)
            ->postJson("/api/v1/properties/{$this->property->id}/contact", [
                'message' => 'Hello, I am interested in viewing this property.',
                'phone' => '01711112222',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('contact_requests', [
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'status' => 'pending',
        ]);

        // Landlord received in-app notification
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->landlord->id,
            'role' => 'landlord',
            'type' => 'contact',
            'title' => 'New Contact Request',
            'read' => false,
        ]);

        // 2. Duplicate sequential contact request is rejected inside transaction (FINDING-P5-01)
        $dupResponse = $this->withHeader('Authorization', 'Bearer ' . $this->tenantToken)
            ->postJson("/api/v1/properties/{$this->property->id}/contact", [
                'message' => 'Another duplicate contact message.',
            ]);

        $dupResponse->assertStatus(422);
        $fieldErrors = $dupResponse->json('fieldErrors');
        $this->assertIsArray($fieldErrors);
        $this->assertArrayHasKey('property', $fieldErrors);
    }

    public function test_landlord_accepting_contact_request_notifies_tenant_without_duplicates(): void
    {
        $contactRequest = ContactRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'message' => 'Interested in renting.',
            'status' => 'pending',
        ]);

        // Landlord accepts
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->landlordToken)
            ->patchJson("/api/v1/landlord/contact-requests/{$contactRequest->id}/status", [
                'status' => 'accepted',
                'landlord_note' => 'Sure, let us chat.',
            ]);

        $res->assertStatus(200);

        // Tenant receives notification
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->tenant->id,
            'role' => 'tenant',
            'type' => 'contact',
            'title' => 'Contact Request Accepted',
        ]);

        $notifCount = Notification::where('user_id', $this->tenant->id)->count();
        $this->assertEquals(1, $notifCount);

        // Submitting status = 'accepted' again does NOT create duplicate notification
        $repeatRes = $this->withHeader('Authorization', 'Bearer ' . $this->landlordToken)
            ->patchJson("/api/v1/landlord/contact-requests/{$contactRequest->id}/status", [
                'status' => 'accepted',
            ]);

        $repeatRes->assertStatus(200);
        $this->assertEquals(1, Notification::where('user_id', $this->tenant->id)->count());
    }

    public function test_first_message_lazily_creates_conversation_from_accepted_contact_request(): void
    {
        $contactRequest = ContactRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'message' => 'Interested in renting.',
            'status' => 'accepted',
        ]);

        // Tenant sends first message to accepted contact request
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->tenantToken)
            ->postJson("/api/v1/contact-requests/{$contactRequest->id}/messages", [
                'text' => 'Hello Mr. Rafiq, when is the flat available for move-in?',
            ]);

        $res->assertStatus(201)
            ->assertJsonPath('data.text', 'Hello Mr. Rafiq, when is the flat available for move-in?')
            ->assertJsonPath('data.senderId', (string) $this->tenant->id);

        // Conversation was lazily created
        $this->assertDatabaseHas('conversations', [
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'last_message' => 'Hello Mr. Rafiq, when is the flat available for move-in?',
        ]);

        // Message was stored
        $this->assertDatabaseHas('messages', [
            'sender_id' => $this->tenant->id,
            'text' => 'Hello Mr. Rafiq, when is the flat available for move-in?',
        ]);

        // Landlord received notification about new message
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->landlord->id,
            'role' => 'landlord',
            'type' => 'contact',
            'title' => 'New Message',
        ]);
    }

    public function test_subsequent_messages_reuse_existing_conversation(): void
    {
        $conversation = Conversation::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'last_message' => 'Initial message',
            'last_message_at' => now(),
        ]);

        // Landlord replies in existing conversation
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->landlordToken)
            ->postJson("/api/v1/conversations/{$conversation->id}/messages", [
                'text' => 'It is available starting from the first of next month.',
            ]);

        $res->assertStatus(201)
            ->assertJsonPath('data.text', 'It is available starting from the first of next month.')
            ->assertJsonPath('data.senderId', (string) $this->landlord->id);

        // Conversation was updated, not duplicated
        $this->assertEquals(1, Conversation::count());
        $conversation->refresh();
        $this->assertEquals('It is available starting from the first of next month.', $conversation->last_message);

        // Tenant received notification
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->tenant->id,
            'title' => 'New Message',
        ]);
    }

    public function test_pending_or_rejected_contact_requests_cannot_initiate_conversations(): void
    {
        $pendingCR = ContactRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'message' => 'Pending check',
            'status' => 'pending',
        ]);

        $resPending = $this->withHeader('Authorization', 'Bearer ' . $this->tenantToken)
            ->postJson("/api/v1/contact-requests/{$pendingCR->id}/messages", [
                'text' => 'Trying to message prematurely.',
            ]);

        $resPending->assertStatus(422);

        $rejectedCR = ContactRequest::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'message' => 'Rejected check',
            'status' => 'rejected',
        ]);

        $resRejected = $this->withHeader('Authorization', 'Bearer ' . $this->tenantToken)
            ->postJson("/api/v1/contact-requests/{$rejectedCR->id}/messages", [
                'text' => 'Trying to message on rejected request.',
            ]);

        $resRejected->assertStatus(422);
    }

    public function test_unrelated_users_cannot_access_or_message_conversation(): void
    {
        $conversation = Conversation::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'last_message' => 'Private thread',
            'last_message_at' => now(),
        ]);

        // Other tenant tries to view
        $viewRes = $this->withHeader('Authorization', 'Bearer ' . $this->otherTenantToken)
            ->getJson("/api/v1/conversations/{$conversation->id}");

        $viewRes->assertStatus(403);

        // Other landlord tries to send message
        $sendRes = $this->withHeader('Authorization', 'Bearer ' . $this->otherLandlordToken)
            ->postJson("/api/v1/conversations/{$conversation->id}/messages", [
                'text' => 'Intruding message',
            ]);

        $sendRes->assertStatus(403);
    }

    public function test_message_validation_rejects_empty_and_excessive_length(): void
    {
        $conversation = Conversation::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'last_message' => 'Active',
            'last_message_at' => now(),
        ]);

        // Empty text
        $emptyRes = $this->withHeader('Authorization', 'Bearer ' . $this->tenantToken)
            ->postJson("/api/v1/conversations/{$conversation->id}/messages", [
                'text' => '   ',
            ]);
        $emptyRes->assertStatus(422);
        $emptyFieldErrors = $emptyRes->json('fieldErrors');
        $this->assertIsArray($emptyFieldErrors);
        $this->assertArrayHasKey('text', $emptyFieldErrors);

        // Over 2000 characters
        $hugeText = str_repeat('A', 2001);
        $hugeRes = $this->withHeader('Authorization', 'Bearer ' . $this->tenantToken)
            ->postJson("/api/v1/conversations/{$conversation->id}/messages", [
                'text' => $hugeText,
            ]);
        $hugeRes->assertStatus(422);
        $hugeFieldErrors = $hugeRes->json('fieldErrors');
        $this->assertIsArray($hugeFieldErrors);
        $this->assertArrayHasKey('text', $hugeFieldErrors);
    }

    public function test_notification_lifecycle_unread_count_and_isolation(): void
    {
        Notification::create([
            'user_id' => $this->tenant->id,
            'role' => 'tenant',
            'type' => 'contact',
            'title' => 'First Notification',
            'title_bn' => 'প্রথম বিজ্ঞপ্তি',
            'message' => 'Message details 1',
            'message_bn' => 'বার্তার বিবরণ ১',
            'read' => false,
        ]);

        $notif2 = Notification::create([
            'user_id' => $this->tenant->id,
            'role' => 'tenant',
            'type' => 'visit',
            'title' => 'Second Notification',
            'title_bn' => 'দ্বিতীয় বিজ্ঞপ্তি',
            'message' => 'Message details 2',
            'message_bn' => 'বার্তার বিবরণ ২',
            'read' => false,
        ]);

        // Other user's notification
        $otherNotif = Notification::create([
            'user_id' => $this->otherTenant->id,
            'role' => 'tenant',
            'type' => 'contact',
            'title' => 'Other Notification',
            'title_bn' => 'অন্য বিজ্ঞপ্তি',
            'message' => 'Other message details',
            'message_bn' => 'অন্য বার্তার বিবরণ',
            'read' => false,
        ]);

        // 1. Tenant sees only their notifications
        $listRes = $this->withHeader('Authorization', 'Bearer ' . $this->tenantToken)
            ->getJson('/api/v1/notifications');

        $listRes->assertStatus(200)
            ->assertJsonCount(2, 'data');

        // 2. Unread count is exactly 2
        $countRes = $this->withHeader('Authorization', 'Bearer ' . $this->tenantToken)
            ->getJson('/api/v1/notifications/unread-count');

        $countRes->assertStatus(200)
            ->assertJsonPath('count', 2);

        // 3. Mark single notification as read
        $readRes = $this->withHeader('Authorization', 'Bearer ' . $this->tenantToken)
            ->patchJson("/api/v1/notifications/{$notif2->id}/read");

        $readRes->assertStatus(200);
        $notif2->refresh();
        $this->assertTrue($notif2->read);

        // Unread count is now 1
        $countRes2 = $this->withHeader('Authorization', 'Bearer ' . $this->tenantToken)
            ->getJson('/api/v1/notifications/unread-count');
        $countRes2->assertJsonPath('count', 1);

        // 4. Tenant cannot mark other tenant's notification as read (404/403)
        $hackRes = $this->withHeader('Authorization', 'Bearer ' . $this->tenantToken)
            ->patchJson("/api/v1/notifications/{$otherNotif->id}/read");
        $hackRes->assertStatus(404);

        // 5. Mark all read
        $markAllRes = $this->withHeader('Authorization', 'Bearer ' . $this->tenantToken)
            ->postJson('/api/v1/notifications/mark-all-read');
        $markAllRes->assertStatus(200);

        // Unread count is now 0 for tenant
        $countRes3 = $this->withHeader('Authorization', 'Bearer ' . $this->tenantToken)
            ->getJson('/api/v1/notifications/unread-count');
        $countRes3->assertJsonPath('count', 0);

        // Other tenant's notification is still unread
        $otherNotif->refresh();
        $this->assertFalse($otherNotif->read);
    }

    public function test_non_participant_cannot_view_conversation(): void
    {
        $conversation = Conversation::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'last_message' => 'Landlord reply.',
            'last_message_at' => now(),
        ]);

        $this->withHeader('Authorization', 'Bearer ' . $this->otherTenantToken)
            ->getJson("/api/v1/conversations/{$conversation->id}")
            ->assertStatus(403);
    }

    public function test_conversation_viewing_marks_incoming_messages_read_receipts(): void
    {
        $conversation = Conversation::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->tenant->id,
            'landlord_id' => $this->landlord->id,
            'last_message' => 'Landlord reply.',
            'last_message_at' => now(),
        ]);

        // Message 1: Outgoing from tenant (should not be marked by tenant viewing)
        $msgTenant = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->tenant->id,
            'text' => 'Hello landlord',
            'read_at' => null,
        ]);

        // Message 2: Incoming from landlord (unread)
        $msgLandlord = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->landlord->id,
            'text' => 'Hello tenant, flat is ready',
            'read_at' => null,
        ]);

        // Other conversation message (should remain untouched)
        $otherConv = Conversation::create([
            'property_id' => $this->property->id,
            'tenant_id' => $this->otherTenant->id,
            'landlord_id' => $this->landlord->id,
            'last_message' => 'Other msg',
            'last_message_at' => now(),
        ]);
        $otherMsg = Message::create([
            'conversation_id' => $otherConv->id,
            'sender_id' => $this->landlord->id,
            'text' => 'Other message text',
            'read_at' => null,
        ]);

        // Tenant views conversation
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->tenantToken)
            ->getJson("/api/v1/conversations/{$conversation->id}");

        $response->assertStatus(200);

        // Incoming message is marked read
        $msgLandlord->refresh();
        $this->assertNotNull($msgLandlord->read_at);

        // Outgoing message is still null
        $msgTenant->refresh();
        $this->assertNull($msgTenant->read_at);

        // Other conversation message is still null
        $otherMsg->refresh();
        $this->assertNull($otherMsg->read_at);
    }

    public function test_suspended_user_cannot_use_messaging_or_notifications(): void
    {
        $this->tenant->status = 'suspended';
        $this->tenant->save();

        $msgRes = $this->withHeader('Authorization', 'Bearer ' . $this->tenantToken)
            ->getJson('/api/v1/conversations');
        $msgRes->assertStatus(403);

        $notifRes = $this->withHeader('Authorization', 'Bearer ' . $this->tenantToken)
            ->getJson('/api/v1/notifications');
        $notifRes->assertStatus(403);
    }
}

