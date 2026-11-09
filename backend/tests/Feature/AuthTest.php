<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    public function test_user_can_register_as_tenant(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Test Tenant',
            'email' => 'test_tenant@example.com',
            'phone' => '01700000001',
            'password' => 'Password123!',
            'role' => 'tenant',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.user.email', 'test_tenant@example.com')
            ->assertJsonPath('data.user.role', 'tenant')
            ->assertJsonStructure(['data' => ['user', 'token']]);

        $this->assertDatabaseHas('users', ['email' => 'test_tenant@example.com']);
    }

    public function test_user_cannot_register_as_admin_via_public_endpoint(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Malicious Admin',
            'email' => 'hacker@example.com',
            'phone' => '01700000002',
            'password' => 'Password123!',
            'role' => 'admin',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('status', 422);

        $this->assertDatabaseMissing('users', ['email' => 'hacker@example.com']);
    }

    public function test_user_can_login_with_email(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        User::create([
            'name' => 'Login Tester',
            'email' => 'login_tester@example.com',
            'phone' => '01700000003',
            'password' => 'Secret123',
            'role_id' => $tenantRole->id,
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'login_tester@example.com',
            'password' => 'Secret123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.user.email', 'login_tester@example.com')
            ->assertJsonStructure(['data' => ['user', 'token']]);
    }

    public function test_user_can_login_with_phone(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        User::create([
            'name' => 'Phone Tester',
            'email' => 'phone_tester@example.com',
            'phone' => '01700000004',
            'password' => 'Secret123',
            'role_id' => $tenantRole->id,
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'identifier' => '01700000004',
            'password' => 'Secret123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.user.phone', '01700000004');
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'nonexistent@example.com',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('status', 401)
            ->assertJsonPath('message', 'auth.errors.invalid');
    }

    public function test_suspended_user_cannot_login(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = new User([
            'name' => 'Suspended User',
            'email' => 'suspended@example.com',
            'phone' => '01700000005',
            'password' => 'Secret123',
        ]);
        $user->role_id = $tenantRole->id;
        $user->status = 'suspended';
        $user->save();

        $response = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'suspended@example.com',
            'password' => 'Secret123',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('status', 403)
            ->assertJsonPath('message', 'auth.errors.suspended');
    }

    public function test_authenticated_user_can_access_me_endpoint(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = User::create([
            'name' => 'Me Tester',
            'email' => 'me_tester@example.com',
            'phone' => '01700000006',
            'password' => 'Secret123',
            'role_id' => $tenantRole->id,
            'status' => 'active',
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJsonPath('data.user.email', 'me_tester@example.com');
    }

    public function test_user_can_logout_and_token_is_revoked(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = new User([
            'name' => 'Logout Tester',
            'email' => 'logout_tester@example.com',
            'phone' => '01700000007',
            'password' => 'Secret123',
        ]);
        $user->role_id = $tenantRole->id;
        $user->status = 'active';
        $user->save();

        $token = $user->createToken('logout-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/logout');

        $response->assertStatus(200);

        // Verify token was deleted from database
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
        ]);

        // Reset in-memory auth guard cache for consecutive test request
        $this->app['auth']->forgetGuards();

        // Subsequent call with revoked token returns 401
        $subsequent = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/auth/me');

        $subsequent->assertStatus(401);
    }

    public function test_user_registration_dispatches_verification_notification(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Verify Test User',
            'email' => 'verify_notify@example.com',
            'phone' => '01700000020',
            'password' => 'Password123!',
            'role' => 'tenant',
        ]);

        $response->assertStatus(201);

        $user = User::where('email', 'verify_notify@example.com')->first();
        $this->assertNotNull($user);
        $this->assertNull($user->email_verified_at);

        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_forgot_password_sends_notification_for_existing_user(): void
    {
        Notification::fake();

        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = User::create([
            'name' => 'Forgot Tester',
            'email' => 'forgot_tester@example.com',
            'phone' => '01700000021',
            'password' => Hash::make('OldPassword123!'),
            'role_id' => $tenantRole->id,
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'forgot_tester@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 200)
            ->assertJsonPath('message', 'auth.feedback.resetInitiated');

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_forgot_password_returns_generic_success_for_nonexistent_email(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'nonexistent_account@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 200)
            ->assertJsonPath('message', 'auth.feedback.resetInitiated');

        Notification::assertNothingSent();
    }

    public function test_user_can_reset_password_with_valid_token(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = User::create([
            'name' => 'Reset Token Tester',
            'email' => 'reset_token_tester@example.com',
            'phone' => '01700000022',
            'password' => Hash::make('OldPassword123!'),
            'role_id' => $tenantRole->id,
            'status' => 'active',
        ]);

        $token = Password::createToken($user);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'reset_token_tester@example.com',
            'code' => $token,
            'password' => 'NewSecurePassword123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 200)
            ->assertJsonPath('message', 'auth.feedback.passwordReset');

        $this->assertTrue(Hash::check('NewSecurePassword123!', $user->fresh()->password));
    }

    public function test_password_reset_revokes_all_active_tokens(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = User::create([
            'name' => 'Token Revoke Tester',
            'email' => 'token_revoke_tester@example.com',
            'phone' => '01700000023',
            'password' => Hash::make('OldPassword123!'),
            'role_id' => $tenantRole->id,
            'status' => 'active',
        ]);

        $token1 = $user->createToken('session-1')->plainTextToken;
        $token2 = $user->createToken('session-2')->plainTextToken;

        $this->assertDatabaseHas('personal_access_tokens', ['tokenable_id' => $user->id]);

        $resetToken = Password::createToken($user);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'token_revoke_tester@example.com',
            'code' => $resetToken,
            'password' => 'NewSecurePassword123!',
        ]);

        $response->assertStatus(200);

        // Verify all personal access tokens for user were deleted
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $user->id]);
    }

    public function test_password_reset_fails_with_reused_token(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = User::create([
            'name' => 'Reused Token Tester',
            'email' => 'reused_tester@example.com',
            'phone' => '01700000024',
            'password' => Hash::make('OldPassword123!'),
            'role_id' => $tenantRole->id,
            'status' => 'active',
        ]);

        $token = Password::createToken($user);

        // First reset (success)
        $first = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'reused_tester@example.com',
            'code' => $token,
            'password' => 'FirstNewPassword123!',
        ]);
        $first->assertStatus(200);

        // Second reset with same token (must fail)
        $second = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'reused_tester@example.com',
            'code' => $token,
            'password' => 'SecondNewPassword123!',
        ]);
        $second->assertStatus(422)
            ->assertJsonPath('status', 422)
            ->assertJsonPath('message', 'auth.errors.code');
    }

    public function test_password_reset_fails_with_invalid_token(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = User::create([
            'name' => 'Invalid Token Tester',
            'email' => 'invalid_tester@example.com',
            'phone' => '01700000025',
            'password' => Hash::make('OldPassword123!'),
            'role_id' => $tenantRole->id,
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'invalid_tester@example.com',
            'code' => 'fabricated-invalid-reset-token-value',
            'password' => 'NewPassword123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('status', 422)
            ->assertJsonPath('message', 'auth.errors.code');

        $this->assertTrue(Hash::check('OldPassword123!', $user->fresh()->password));
    }

    public function test_password_reset_fails_with_old_hardcoded_bypass_code(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = User::create([
            'name' => 'Bypass Code Tester',
            'email' => 'bypass_tester@example.com',
            'phone' => '01700000026',
            'password' => Hash::make('OldPassword123!'),
            'role_id' => $tenantRole->id,
            'status' => 'active',
        ]);

        // Attempt account takeover using old hardcoded bypass code '123456'
        $response = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'bypass_tester@example.com',
            'code' => '123456',
            'password' => 'AttackerPassword123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('status', 422)
            ->assertJsonPath('message', 'auth.errors.code');

        // Verify password remained unchanged
        $this->assertTrue(Hash::check('OldPassword123!', $user->fresh()->password));
    }

    public function test_email_can_be_verified_with_valid_signed_url(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = User::create([
            'name' => 'Signed Verify Tester',
            'email' => 'signed_verify@example.com',
            'phone' => '01700000027',
            'password' => Hash::make('Password123!'),
            'role_id' => $tenantRole->id,
            'status' => 'active',
            'email_verified_at' => null,
        ]);

        $signedUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())]
        );

        $response = $this->getJson($signedUrl);

        $response->assertStatus(200)
            ->assertJsonPath('status', 200)
            ->assertJsonPath('message', 'auth.feedback.verified');

        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }

    public function test_signed_email_verification_redirects_for_browser_requests(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = User::create([
            'name' => 'Browser Verify Tester',
            'email' => 'browser_verify@example.com',
            'phone' => '01700000028',
            'password' => Hash::make('Password123!'),
            'role_id' => $tenantRole->id,
            'status' => 'active',
            'email_verified_at' => null,
        ]);

        $signedUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())]
        );

        $response = $this->get($signedUrl);

        $response->assertStatus(302);
        $this->assertStringContainsString('/verify-email?status=success', $response->headers->get('Location') ?? '');
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }

    public function test_email_verification_fails_with_invalid_signature(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = User::create([
            'name' => 'Tampered Signature Tester',
            'email' => 'tampered_signature@example.com',
            'phone' => '01700000029',
            'password' => Hash::make('Password123!'),
            'role_id' => $tenantRole->id,
            'status' => 'active',
            'email_verified_at' => null,
        ]);

        $tamperedUrl = "/api/v1/auth/verify-email/{$user->id}/".sha1($user->getEmailForVerification())
            .'?expires='.now()->addHour()->timestamp.'&signature=fraudulent_signature';

        $response = $this->getJson($tamperedUrl);

        $response->assertStatus(403)
            ->assertJsonPath('status', 403)
            ->assertJsonPath('message', 'auth.errors.invalidSignature');

        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_email_verification_fails_with_expired_signature(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = User::create([
            'name' => 'Expired Verify Tester',
            'email' => 'expired_verify@example.com',
            'phone' => '01700000030',
            'password' => Hash::make('Password123!'),
            'role_id' => $tenantRole->id,
            'status' => 'active',
            'email_verified_at' => null,
        ]);

        // Generate signed URL that expired 10 minutes ago
        $expiredUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->subMinutes(10),
            ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())]
        );

        $response = $this->getJson($expiredUrl);

        $response->assertStatus(403)
            ->assertJsonPath('status', 403)
            ->assertJsonPath('message', 'auth.errors.invalidSignature');

        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_email_verification_fails_with_cross_account_email_hash(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        $userA = User::create([
            'name' => 'User A',
            'email' => 'user_a@example.com',
            'phone' => '01700000031',
            'password' => Hash::make('Password123!'),
            'role_id' => $tenantRole->id,
            'status' => 'active',
            'email_verified_at' => null,
        ]);
        $userB = User::create([
            'name' => 'User B',
            'email' => 'user_b@example.com',
            'phone' => '01700000032',
            'password' => Hash::make('Password123!'),
            'role_id' => $tenantRole->id,
            'status' => 'active',
            'email_verified_at' => null,
        ]);

        // Sign for User A but target User B's hash
        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $userA->id, 'hash' => sha1($userB->getEmailForVerification())]
        );

        $response = $this->getJson($url);

        $response->assertStatus(403);
        $this->assertFalse($userA->fresh()->hasVerifiedEmail());
    }

    public function test_unauthenticated_user_cannot_resend_verification_notification(): void
    {
        $response = $this->postJson('/api/v1/auth/resend-code');
        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_resend_verification_notification(): void
    {
        Notification::fake();

        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = User::create([
            'name' => 'Resend Auth Tester',
            'email' => 'resend_auth@example.com',
            'phone' => '01700000033',
            'password' => Hash::make('Password123!'),
            'role_id' => $tenantRole->id,
            'status' => 'active',
            'email_verified_at' => null,
        ]);

        $token = $user->createToken('resend-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/resend-code');

        $response->assertStatus(200)
            ->assertJsonPath('status', 200)
            ->assertJsonPath('message', 'auth.feedback.codeResent');

        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_already_verified_user_resend_does_not_send_notification(): void
    {
        Notification::fake();

        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = User::create([
            'name' => 'Already Verified Tester',
            'email' => 'already_verified@example.com',
            'phone' => '01700000034',
            'password' => Hash::make('Password123!'),
            'role_id' => $tenantRole->id,
            'status' => 'active',
        ]);
        $user->email_verified_at = Carbon::now();
        $user->save();

        $token = $user->createToken('already-verified-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/resend-code');

        $response->assertStatus(200)
            ->assertJsonPath('status', 200)
            ->assertJsonPath('message', 'auth.feedback.alreadyVerified');

        Notification::assertNothingSent();
    }

    public function test_tenant_can_update_own_name_and_phone(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = new User([
            'name' => 'Original Tenant',
            'email' => 'tenant_profile@example.com',
            'phone' => '01700000040',
            'password' => Hash::make('Password123!'),
        ]);
        $user->role_id = $tenantRole->id;
        $user->status = 'active';
        $user->save();
        $token = $user->createToken('tenant-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/v1/auth/me', [
                'name' => 'Updated Tenant Name',
                'phone' => '01700000041',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 200)
            ->assertJsonPath('data.user.name', 'Updated Tenant Name')
            ->assertJsonPath('data.user.phone', '01700000041')
            ->assertJsonPath('data.user.role', 'tenant');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Tenant Name',
            'phone' => '01700000041',
        ]);
    }

    public function test_landlord_can_update_own_name_and_phone(): void
    {
        $landlordRole = Role::where('slug', 'landlord')->first();
        $user = new User([
            'name' => 'Original Landlord',
            'email' => 'landlord_profile@example.com',
            'phone' => '01800000040',
            'password' => Hash::make('Password123!'),
        ]);
        $user->role_id = $landlordRole->id;
        $user->status = 'active';
        $user->save();
        $token = $user->createToken('landlord-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/v1/auth/me', [
                'name' => 'Updated Landlord Name',
                'phone' => '01800000041',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 200)
            ->assertJsonPath('data.user.name', 'Updated Landlord Name')
            ->assertJsonPath('data.user.phone', '01800000041')
            ->assertJsonPath('data.user.role', 'landlord');
    }

    public function test_admin_can_update_own_name_and_phone(): void
    {
        $adminRole = Role::where('slug', 'admin')->first();
        $user = new User([
            'name' => 'Original Admin',
            'email' => 'admin_profile@example.com',
            'phone' => '01900000040',
            'password' => Hash::make('Password123!'),
        ]);
        $user->role_id = $adminRole->id;
        $user->status = 'active';
        $user->save();
        $token = $user->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/v1/auth/me', [
                'name' => 'Updated Admin Name',
                'phone' => '01900000041',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 200)
            ->assertJsonPath('data.user.name', 'Updated Admin Name')
            ->assertJsonPath('data.user.phone', '01900000041')
            ->assertJsonPath('data.user.role', 'admin');
    }

    public function test_omitted_phone_preserves_existing_phone_value(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = new User([
            'name' => 'Phone Preserver',
            'email' => 'preserve_phone@example.com',
            'phone' => '01712345678',
            'password' => Hash::make('Password123!'),
        ]);
        $user->role_id = $tenantRole->id;
        $user->status = 'active';
        $user->save();
        $token = $user->createToken('tenant-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/v1/auth/me', [
                'name' => 'New Name Only',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.user.name', 'New Name Only')
            ->assertJsonPath('data.user.phone', '01712345678');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'New Name Only',
            'phone' => '01712345678',
        ]);
    }

    public function test_explicitly_cleared_phone_follows_nullable_validation(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = new User([
            'name' => 'Clear Phone User',
            'email' => 'clear_phone@example.com',
            'phone' => '01712345678',
            'password' => Hash::make('Password123!'),
        ]);
        $user->role_id = $tenantRole->id;
        $user->status = 'active';
        $user->save();
        $token = $user->createToken('tenant-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/v1/auth/me', [
                'name' => 'Clear Phone User',
                'phone' => '',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.user.phone', '');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'phone' => null,
        ]);
    }

    public function test_profile_update_validation_rejects_empty_name_or_oversized_fields(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        $user = new User([
            'name' => 'Validation Test User',
            'email' => 'val_user@example.com',
            'phone' => '01700000049',
            'password' => Hash::make('Password123!'),
        ]);
        $user->role_id = $tenantRole->id;
        $user->status = 'active';
        $user->save();
        $token = $user->createToken('tenant-token')->plainTextToken;

        // Empty name
        $res1 = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/v1/auth/me', [
                'name' => '',
            ]);
        $res1->assertStatus(422)
            ->assertJsonStructure(['fieldErrors' => ['name']]);

        // Name > 255
        $res2 = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/v1/auth/me', [
                'name' => str_repeat('a', 256),
            ]);
        $res2->assertStatus(422);

        // Phone > 20
        $res3 = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/v1/auth/me', [
                'name' => 'Valid Name',
                'phone' => str_repeat('1', 25),
            ]);
        $res3->assertStatus(422);
    }

    public function test_unauthenticated_profile_update_is_rejected(): void
    {
        $response = $this->putJson('/api/v1/auth/me', [
            'name' => 'Intruder Name',
        ]);
        $response->assertStatus(401);
    }

    public function test_profile_update_cannot_escalate_role_or_tamper_protected_fields(): void
    {
        $tenantRole = Role::where('slug', 'tenant')->first();
        $adminRole = Role::where('slug', 'admin')->first();
        $originalHash = Hash::make('OriginalPass!');

        $user = new User([
            'name' => 'Target Tenant',
            'email' => 'honest_tenant@example.com',
            'phone' => '01700000050',
            'password' => $originalHash,
        ]);
        $user->role_id = $tenantRole->id;
        $user->status = 'active';
        $user->email_verified_at = Carbon::now();
        $user->save();

        $token = $user->createToken('tenant-token')->plainTextToken;

        // Attempt role escalation, email change, status change, password tampering
        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/v1/auth/me', [
                'name' => 'Honest Tenant Renamed',
                'role' => 'admin',
                'role_id' => $adminRole->id,
                'email' => 'hacked@example.com',
                'status' => 'suspended',
                'password' => 'HackedPassword123!',
                'email_verified_at' => null,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.user.name', 'Honest Tenant Renamed')
            ->assertJsonPath('data.user.email', 'honest_tenant@example.com')
            ->assertJsonPath('data.user.role', 'tenant')
            ->assertJsonPath('data.user.status', 'active');

        // Verify database fields were NOT tampered with
        $refreshed = $user->fresh(['role']);
        $this->assertEquals('tenant', $refreshed->role->slug);
        $this->assertEquals($tenantRole->id, $refreshed->role_id);
        $this->assertEquals('honest_tenant@example.com', $refreshed->email);
        $this->assertEquals('active', $refreshed->status);
        $this->assertEquals($originalHash, $refreshed->password);
        $this->assertNotNull($refreshed->email_verified_at);
    }
}
