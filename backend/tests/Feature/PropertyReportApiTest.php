<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Property;
use App\Models\PropertyReport;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PropertyReportApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $tenant;
    protected User $otherTenant;
    protected User $landlord;
    protected User $admin;
    protected Property $property;
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
            'name' => 'Tanvir Tenant',
            'email' => 'tanvir@thikana.test',
            'phone' => '01711112222',
            'password' => bcrypt('Password123!'),
        ]);
        $this->tenant->role_id = $tenantRole->id;
        $this->tenant->status = 'active';
        $this->tenant->save();
        $this->tenantToken = $this->tenant->createToken('tenant', ['role:tenant'])->plainTextToken;

        $this->otherTenant = new User([
            'name' => 'Other Tenant',
            'email' => 'other_tenant@thikana.test',
            'phone' => '01711113333',
            'password' => bcrypt('Password123!'),
        ]);
        $this->otherTenant->role_id = $tenantRole->id;
        $this->otherTenant->status = 'active';
        $this->otherTenant->save();
        $this->otherTenantToken = $this->otherTenant->createToken('other', ['role:tenant'])->plainTextToken;

        $this->landlord = new User([
            'name' => 'Kamal Landlord',
            'email' => 'kamal@thikana.test',
            'phone' => '01722223333',
            'password' => bcrypt('Password123!'),
        ]);
        $this->landlord->role_id = $landlordRole->id;
        $this->landlord->status = 'active';
        $this->landlord->save();
        $this->landlordToken = $this->landlord->createToken('landlord', ['role:landlord'])->plainTextToken;

        $this->admin = new User([
            'name' => 'Moderator Admin',
            'email' => 'moderator@thikana.test',
            'phone' => '01733334444',
            'password' => bcrypt('Password123!'),
        ]);
        $this->admin->role_id = $adminRole->id;
        $this->admin->status = 'active';
        $this->admin->save();
        $this->adminToken = $this->admin->createToken('admin', ['role:admin'])->plainTextToken;

        $this->property = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Spacious Flat in Mirpur',
            'bangla_title' => 'মিরপুরে চমৎকার ফ্ল্যাট',
            'slug' => 'spacious-flat-in-mirpur',
            'property_type' => 'Apartment',
            'rental_type' => 'Family Flat',
            'rent' => 20000.00,
            'advance' => 40000.00,
            'additional_charges' => 2000.00,
            'bills_included' => ['Water Supply'],
            'availability' => 'Available',
            'available_from' => '2026-11-01',
            'approval_status' => 'Approved',
            'size' => 1100,
            'rooms' => 3,
            'bathrooms' => 2,
            'balconies' => 2,
            'floor' => '4th Floor',
            'total_floors' => 6,
            'furnished_status' => 'Unfurnished',
            'preferred_tenant' => 'Any',
            'public_contact_visible' => false,
            'community_info' => [],
            'rating' => 0.0,
            'review_count' => 0,
        ]);
    }

    public function test_unauthenticated_user_cannot_submit_report(): void
    {
        $res = $this->postJson("/api/v1/properties/{$this->property->id}/reports", [
            'reason' => 'Fake listing',
        ]);
        $res->assertStatus(401);
    }

    public function test_landlord_cannot_submit_report(): void
    {
        $res = $this->withToken($this->landlordToken)->postJson("/api/v1/properties/{$this->property->id}/reports", [
            'reason' => 'Fake listing',
        ]);
        $res->assertStatus(403);
    }

    public function test_tenant_can_submit_valid_report(): void
    {
        $res = $this->withToken($this->tenantToken)->postJson("/api/v1/properties/{$this->property->id}/reports", [
            'reason' => 'Fake listing',
            'details' => 'The phone number provided is fraudulent.',
        ]);

        $res->assertStatus(201);
        $res->assertJsonPath('data.propertyId', (string) $this->property->id);
        $res->assertJsonPath('data.reporterId', (string) $this->tenant->id);
        $res->assertJsonPath('data.reason', 'Fake listing');
        $res->assertJsonPath('data.status', 'Pending Review');

        $this->assertDatabaseHas('property_reports', [
            'property_id' => $this->property->id,
            'reporter_id' => $this->tenant->id,
            'reason' => 'Fake listing',
            'status' => 'pending',
        ]);
    }

    public function test_other_reason_requires_details(): void
    {
        $res = $this->withToken($this->tenantToken)->postJson("/api/v1/properties/{$this->property->id}/reports", [
            'reason' => 'Other',
            'details' => '',
        ]);

        $res->assertStatus(422);
        $res->assertJsonFragment(['A description is mandatory when selecting Other as the reason.']);
    }

    public function test_prevent_duplicate_pending_reports_from_same_tenant(): void
    {
        PropertyReport::create([
            'property_id' => $this->property->id,
            'reporter_id' => $this->tenant->id,
            'reason' => 'Already rented',
            'status' => 'pending',
        ]);

        $res = $this->withToken($this->tenantToken)->postJson("/api/v1/properties/{$this->property->id}/reports", [
            'reason' => 'Fake listing',
        ]);

        $res->assertStatus(422);
        $res->assertJsonFragment(['You already have a pending report for this property.']);
    }

    public function test_different_tenants_can_report_same_property(): void
    {
        PropertyReport::create([
            'property_id' => $this->property->id,
            'reporter_id' => $this->tenant->id,
            'reason' => 'Already rented',
            'status' => 'pending',
        ]);

        $res = $this->withToken($this->otherTenantToken)->postJson("/api/v1/properties/{$this->property->id}/reports", [
            'reason' => 'Suspicious behavior',
            'details' => 'Demanding advance before visit.',
        ]);

        $res->assertStatus(201);
    }

    public function test_admin_can_view_report_queue_with_status_filter(): void
    {
        PropertyReport::create([
            'property_id' => $this->property->id,
            'reporter_id' => $this->tenant->id,
            'reason' => 'Fake listing',
            'status' => 'pending',
        ]);

        PropertyReport::create([
            'property_id' => $this->property->id,
            'reporter_id' => $this->otherTenant->id,
            'reason' => 'Already rented',
            'status' => 'resolved',
            'admin_notes' => 'Confirmed rented.',
            'resolved_by' => $this->admin->id,
            'resolved_at' => now(),
        ]);

        // Filter pending
        $resPending = $this->withToken($this->adminToken)->getJson('/api/v1/admin/reports?status=pending');
        $resPending->assertStatus(200);
        $this->assertCount(1, $resPending->json('data'));
        $this->assertEquals('Pending Review', $resPending->json('data.0.status'));

        // Filter resolved
        $resResolved = $this->withToken($this->adminToken)->getJson('/api/v1/admin/reports?status=resolved');
        $resResolved->assertStatus(200);
        $this->assertCount(1, $resResolved->json('data'));
        $this->assertEquals('Resolved', $resResolved->json('data.0.status'));
    }

    public function test_admin_can_inspect_single_report_details(): void
    {
        $report = PropertyReport::create([
            'property_id' => $this->property->id,
            'reporter_id' => $this->tenant->id,
            'reason' => 'Incorrect information',
            'details' => 'Says 3 bed but actually 2 bed.',
            'status' => 'pending',
        ]);

        $res = $this->withToken($this->adminToken)->getJson("/api/v1/admin/reports/{$report->id}");
        $res->assertStatus(200);
        $res->assertJsonPath('data.id', (string) $report->id);
        $res->assertJsonPath('data.details', 'Says 3 bed but actually 2 bed.');
    }

    public function test_admin_can_resolve_report_and_creates_audit_log(): void
    {
        $report = PropertyReport::create([
            'property_id' => $this->property->id,
            'reporter_id' => $this->tenant->id,
            'reason' => 'Fake listing',
            'status' => 'pending',
        ]);

        $res = $this->withToken($this->adminToken)->postJson("/api/v1/admin/reports/{$report->id}/resolve", [
            'status' => 'Resolved',
            'admin_notes' => 'Investigated with landlord. Misunderstanding cleared.',
            'action_on_property' => 'none',
        ]);

        $res->assertStatus(200);
        $res->assertJsonPath('data.status', 'Resolved');

        $report->refresh();
        $this->assertEquals('resolved', $report->status);
        $this->assertEquals($this->admin->id, $report->resolved_by);

        // Verify audit log
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'REPORT_RESOLVED',
            'target_type' => 'report',
            'target_id' => (string) $report->id,
        ]);
    }

    public function test_admin_can_dismiss_report(): void
    {
        $report = PropertyReport::create([
            'property_id' => $this->property->id,
            'reporter_id' => $this->tenant->id,
            'reason' => 'Suspicious behavior',
            'status' => 'pending',
        ]);

        $res = $this->withToken($this->adminToken)->postJson("/api/v1/admin/reports/{$report->id}/resolve", [
            'status' => 'Dismissed',
            'admin_notes' => 'Report lacked verifiable substance.',
        ]);

        $res->assertStatus(200);
        $res->assertJsonPath('data.status', 'Dismissed');

        $report->refresh();
        $this->assertEquals('dismissed', $report->status);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'REPORT_DISMISSED',
            'target_type' => 'report',
            'target_id' => (string) $report->id,
        ]);
    }

    public function test_admin_can_reject_property_during_report_resolution(): void
    {
        $report = PropertyReport::create([
            'property_id' => $this->property->id,
            'reporter_id' => $this->tenant->id,
            'reason' => 'Fake listing',
            'status' => 'pending',
        ]);

        $res = $this->withToken($this->adminToken)->postJson("/api/v1/admin/reports/{$report->id}/resolve", [
            'status' => 'Resolved',
            'admin_notes' => 'Confirmed fake photos. Rejecting listing.',
            'action_on_property' => 'reject',
        ]);

        $res->assertStatus(200);
        $this->property->refresh();
        $this->assertEquals('Rejected', $this->property->approval_status);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'PROPERTY_REJECTED',
            'target_type' => 'property',
            'target_id' => (string) $this->property->id,
        ]);
    }

    public function test_resolution_notes_are_mandatory(): void
    {
        $report = PropertyReport::create([
            'property_id' => $this->property->id,
            'reporter_id' => $this->tenant->id,
            'reason' => 'Fake listing',
            'status' => 'pending',
        ]);

        $res = $this->withToken($this->adminToken)->postJson("/api/v1/admin/reports/{$report->id}/resolve", [
            'status' => 'Resolved',
            'admin_notes' => '  ',
        ]);

        $res->assertStatus(422);
    }

    public function test_already_resolved_report_cannot_be_re_resolved(): void
    {
        $report = PropertyReport::create([
            'property_id' => $this->property->id,
            'reporter_id' => $this->tenant->id,
            'reason' => 'Fake listing',
            'status' => 'resolved',
            'admin_notes' => 'First resolution note.',
            'resolved_by' => $this->admin->id,
            'resolved_at' => now(),
        ]);

        $res = $this->withToken($this->adminToken)->postJson("/api/v1/admin/reports/{$report->id}/resolve", [
            'status' => 'Dismissed',
            'admin_notes' => 'Trying to overwrite.',
        ]);

        $res->assertStatus(422);
    }
}

