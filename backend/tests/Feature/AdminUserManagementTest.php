<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $admin2;
    protected User $tenant;
    protected User $landlord;
    protected string $adminToken;
    protected string $tenantToken;
    protected string $landlordToken;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['slug' => 'admin'], ['name' => 'Admin', 'description' => 'Admin Role']);
        $tenantRole = Role::firstOrCreate(['slug' => 'tenant'], ['name' => 'Tenant', 'description' => 'Tenant Role']);
        $landlordRole = Role::firstOrCreate(['slug' => 'landlord'], ['name' => 'Landlord', 'description' => 'Landlord Role']);

        $this->admin = new User([
            'name' => 'Super Admin',
            'email' => 'superadmin@thikana.test',
            'phone' => '01700000001',
            'password' => bcrypt('AdminPass123!'),
        ]);
        $this->admin->role_id = $adminRole->id;
        $this->admin->status = 'active';
        $this->admin->save();
        $this->adminToken = $this->admin->createToken('admin', ['role:admin'])->plainTextToken;

        $this->admin2 = new User([
            'name' => 'Secondary Admin',
            'email' => 'secondadmin@thikana.test',
            'phone' => '01700000002',
            'password' => bcrypt('AdminPass123!'),
        ]);
        $this->admin2->role_id = $adminRole->id;
        $this->admin2->status = 'active';
        $this->admin2->save();

        $this->tenant = new User([
            'name' => 'Test Tenant',
            'email' => 'tenant_test@thikana.test',
            'phone' => '01800000001',
            'password' => bcrypt('TenantPass123!'),
        ]);
        $this->tenant->role_id = $tenantRole->id;
        $this->tenant->status = 'active';
        $this->tenant->save();
        $this->tenantToken = $this->tenant->createToken('tenant', ['role:tenant'])->plainTextToken;

        $this->landlord = new User([
            'name' => 'Test Landlord',
            'email' => 'landlord_test@thikana.test',
            'phone' => '01900000001',
            'password' => bcrypt('LandlordPass123!'),
        ]);
        $this->landlord->role_id = $landlordRole->id;
        $this->landlord->status = 'active';
        $this->landlord->save();
        $this->landlordToken = $this->landlord->createToken('landlord', ['role:landlord'])->plainTextToken;
    }

    public function test_unauthenticated_access_is_denied(): void
    {
        $this->getJson('/api/v1/admin/users')->assertStatus(401);
        $this->getJson("/api/v1/admin/users/{$this->tenant->id}")->assertStatus(401);
        $this->patchJson("/api/v1/admin/users/{$this->tenant->id}/status", ['status' => 'suspended'])
            ->assertStatus(401);
    }

    public function test_tenant_and_landlord_cannot_access_user_management(): void
    {
        $this->withToken($this->tenantToken)->getJson('/api/v1/admin/users')
            ->assertStatus(403);

        $this->withToken($this->landlordToken)->getJson('/api/v1/admin/users')
            ->assertStatus(403);
    }

    public function test_admin_can_list_users_with_search_and_filters(): void
    {
        $res = $this->withToken($this->adminToken)->getJson('/api/v1/admin/users');
        $res->assertStatus(200);
        $res->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name', 'email', 'phone', 'role', 'roleName', 'verified', 'status', 'createdAt'],
            ],
            'meta' => ['currentPage', 'lastPage', 'perPage', 'total'],
        ]);

        // Search by name
        $searchRes = $this->withToken($this->adminToken)->getJson('/api/v1/admin/users?search=Super');
        $searchRes->assertStatus(200);
        $searchRes->assertJsonFragment(['name' => 'Super Admin']);
        $searchRes->assertJsonMissing(['name' => 'Test Tenant']);

        // Filter by role
        $roleRes = $this->withToken($this->adminToken)->getJson('/api/v1/admin/users?role=landlord');
        $roleRes->assertStatus(200);
        $roleRes->assertJsonFragment(['name' => 'Test Landlord']);
        $roleRes->assertJsonMissing(['name' => 'Test Tenant']);

        // Filter by status
        $statusRes = $this->withToken($this->adminToken)->getJson('/api/v1/admin/users?status=active');
        $statusRes->assertStatus(200);
        $this->assertGreaterThanOrEqual(4, count($statusRes->json('data')));
    }

    public function test_user_detail_does_not_expose_sensitive_attributes(): void
    {
        $res = $this->withToken($this->adminToken)->getJson("/api/v1/admin/users/{$this->tenant->id}");
        $res->assertStatus(200);
        $res->assertJsonFragment(['name' => 'Test Tenant', 'email' => 'tenant_test@thikana.test']);

        $rawResponse = $res->getContent();
        $this->assertStringNotContainsString('password', (string) $rawResponse);
        $this->assertStringNotContainsString('remember_token', (string) $rawResponse);
    }

    public function test_admin_can_suspend_user_and_tokens_are_revoked_immediately(): void
    {
        $this->assertCount(1, $this->tenant->tokens);

        $res = $this->withToken($this->adminToken)->patchJson("/api/v1/admin/users/{$this->tenant->id}/status", [
            'status' => 'suspended',
            'reason' => 'Violation of terms',
        ]);

        $res->assertStatus(200);
        $res->assertJsonPath('data.status', 'suspended');

        // Verify database state
        $this->tenant->refresh();
        $this->assertEquals('suspended', $this->tenant->status);

        // Verify personal access tokens were deleted
        $this->assertCount(0, $this->tenant->tokens);

        // Verify audit log was recorded
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'USER_STATUS_UPDATED',
            'target_type' => 'user',
            'target_id' => (string) $this->tenant->id,
        ]);

        // Attempting to use the old token fails because tokens were deleted
        auth('sanctum')->forgetUser();
        $this->flushHeaders();
        $subsequentRes = $this->withToken($this->tenantToken)->getJson('/api/v1/auth/me');
        $this->assertEquals(401, $subsequentRes->status());
    }

    public function test_admin_can_reactivate_suspended_user(): void
    {
        $this->tenant->status = 'suspended';
        $this->tenant->save();

        auth('sanctum')->forgetUser();
        $this->flushHeaders();
        $res = $this->withToken($this->adminToken)->patchJson("/api/v1/admin/users/{$this->tenant->id}/status", [
            'status' => 'active',
        ]);

        $res->assertStatus(200);
        $res->assertJsonPath('data.status', 'active');
        $this->tenant->refresh();
        $this->assertEquals('active', $this->tenant->status);
    }

    public function test_administrator_cannot_suspend_themselves(): void
    {
        auth('sanctum')->forgetUser();
        $this->flushHeaders();
        $res = $this->withToken($this->adminToken)->patchJson("/api/v1/admin/users/{$this->admin->id}/status", [
            'status' => 'suspended',
        ]);

        $res->assertStatus(422);
        $res->assertJsonFragment(['Administrators cannot suspend their own account.']);
        $this->admin->refresh();
        $this->assertEquals('active', $this->admin->status);
    }

    public function test_last_active_administrator_cannot_be_suspended(): void
    {
        $adminRole = Role::where('slug', 'admin')->first();

        // Verify initial state: exactly 2 active admins
        $this->assertEquals(2, User::where('role_id', $adminRole->id)->where('status', 'active')->count());

        // Admin 1 suspends Admin 2 -> Succeeds (1 active admin remains)
        auth('sanctum')->forgetUser();
        $this->flushHeaders();
        $res = $this->withToken($this->adminToken)->patchJson("/api/v1/admin/users/{$this->admin2->id}/status", [
            'status' => 'suspended',
        ]);
        $res->assertStatus(200);

        // Now exactly 1 active admin remains
        $this->assertEquals(1, User::where('role_id', $adminRole->id)->where('status', 'active')->count());

        // Attempting to suspend the last active admin ($this->admin) fails with 422
        // We simulate a request targeting $this->admin from an admin context
        // Since self-suspension guard triggers first if caller == target, we create an admin caller
        // but ensure the active count invariant is tested:
        $callerAdmin = new User([
            'name' => 'Caller Admin',
            'email' => 'caller_admin@thikana.test',
            'phone' => '01700000099',
            'password' => bcrypt('Pass123!'),
        ]);
        $callerAdmin->role_id = $adminRole->id;
        $callerAdmin->status = 'active';
        $callerAdmin->save();
        $callerToken = $callerAdmin->createToken('c', ['role:admin'])->plainTextToken;

        // Now 2 active admins exist ($this->admin and $callerAdmin).
        // Caller suspends $this->admin -> Leaves 1 active admin ($callerAdmin) -> Succeeds
        auth('sanctum')->forgetUser();
        $this->flushHeaders();
        $this->withToken($callerToken)->patchJson("/api/v1/admin/users/{$this->admin->id}/status", [
            'status' => 'suspended',
        ])->assertStatus(200);

        $this->assertEquals(1, User::where('role_id', $adminRole->id)->where('status', 'active')->count());

        // Now $callerAdmin is the sole active admin.
        // If an authorized admin request attempts to suspend $callerAdmin, it is caught:
        // Self-suspension catches caller == callerAdmin.
        // If another caller (e.g. reactivated admin1) tries to suspend $callerAdmin while only 1 is active:
        $this->admin->status = 'suspended';
        $this->admin->save();

        $adminTokenRecreated = $this->admin->createToken('admin_recreated', ['role:admin'])->plainTextToken;
        // Temporarily bypass EnsureAccountActive for the test by keeping activeAdminCount <= 1
        // Let's verify the exception directly or via controller call:
        $controller = new \App\Http\Controllers\Api\V1\Admin\AdminUserController();
        $request = new \App\Http\Requests\UpdateUserStatusRequest();
        $request->setUserResolver(fn () => $this->admin);
        $request->merge(['status' => 'suspended']);

        $this->expectException(\Illuminate\Validation\ValidationException::class);
        $controller->updateStatus($request, $callerAdmin->id);
    }
}
