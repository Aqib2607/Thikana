<?php

namespace Tests\Feature;

use App\Models\ContactRequest;
use App\Models\Property;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('login');
        RateLimiter::clear('registration');
        RateLimiter::clear('forgot-password');
        RateLimiter::clear('reset-password');
        RateLimiter::clear('verification-resend');
    }

    public function test_cors_allows_configured_whitelisted_origin(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Access-Control-Request-Method' => 'GET',
        ])->options('/api/v1/health');

        $response->assertStatus(204);
        $this->assertEquals('http://localhost:5173', $response->headers->get('Access-Control-Allow-Origin'));
        $this->assertNotEquals('true', $response->headers->get('Access-Control-Allow-Credentials'));
    }

    public function test_cors_rejects_arbitrary_unlisted_and_render_subdomains(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'https://malicious-site.onrender.com',
            'Access-Control-Request-Method' => 'GET',
        ])->options('/api/v1/health');

        $this->assertNull($response->headers->get('Access-Control-Allow-Origin'));
    }

    public function test_cors_rejects_localhost_in_production_environment(): void
    {
        // When cors.allowed_origins has production origins
        Config::set('cors.allowed_origins', ['https://thikana.com', 'https://app.thikana.com']);

        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Access-Control-Request-Method' => 'GET',
        ])->options('/api/v1/health');

        $this->assertNull($response->headers->get('Access-Control-Allow-Origin'));

        $prodResponse = $this->withHeaders([
            'Origin' => 'https://thikana.com',
            'Access-Control-Request-Method' => 'GET',
        ])->options('/api/v1/health');

        $this->assertEquals('https://thikana.com', $prodResponse->headers->get('Access-Control-Allow-Origin'));
    }

    public function test_login_rate_limit_allows_five_attempts_and_blocks_sixth(): void
    {
        $payload = [
            'identifier' => 'testuser@example.com',
            'password' => 'WrongPassword123!',
        ];

        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/v1/auth/login', $payload);
            $this->assertNotEquals(429, $response->status(), "Attempt {$i} should not be throttled");
        }

        $blockedResponse = $this->postJson('/api/v1/auth/login', $payload);
        $blockedResponse->assertStatus(429)
            ->assertJson([
                'status' => 429,
                'message' => 'auth.errors.tooManyAttempts',
            ]);
    }

    public function test_login_rate_limiter_throttles_account_across_different_ips(): void
    {
        $payload = [
            'identifier' => 'target_victim@example.com',
            'password' => 'WrongPassword123!',
        ];

        // 5 attempts from 5 distinct IP addresses
        for ($i = 1; $i <= 5; $i++) {
            $response = $this->withServerVariables(['REMOTE_ADDR' => "198.51.100.{$i}"])
                ->postJson('/api/v1/auth/login', $payload);
            $this->assertNotEquals(429, $response->status(), "IP {$i} should not be throttled yet");
        }

        // 6th attempt from a 6th distinct IP address for the same account must be blocked by the account bucket
        $blockedResponse = $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.99'])
            ->postJson('/api/v1/auth/login', $payload);

        $blockedResponse->assertStatus(429)
            ->assertJson([
                'status' => 429,
                'message' => 'auth.errors.tooManyAttempts',
            ]);
    }

    public function test_login_rate_limiter_throttles_single_ip_across_different_accounts(): void
    {
        $ip = '203.0.113.42';

        // 30 attempts across 30 different account identifiers from the same IP
        for ($i = 1; $i <= 30; $i++) {
            $response = $this->withServerVariables(['REMOTE_ADDR' => $ip])
                ->postJson('/api/v1/auth/login', [
                    'identifier' => "user{$i}@example.com",
                    'password' => 'WrongPassword123!',
                ]);
            $this->assertNotEquals(429, $response->status(), "Attempt {$i} should not be throttled yet");
        }

        // 31st attempt on a new account from the same IP must be blocked by global IP limiter
        $blockedResponse = $this->withServerVariables(['REMOTE_ADDR' => $ip])
            ->postJson('/api/v1/auth/login', [
                'identifier' => 'brand_new_account@example.com',
                'password' => 'WrongPassword123!',
            ]);

        $blockedResponse->assertStatus(429)
            ->assertJson([
                'status' => 429,
                'message' => 'auth.errors.tooManyAttempts',
            ]);
    }

    public function test_login_rate_limiter_normalizes_identifiers(): void
    {
        $variants = [
            '01711223344',
            '01711-223344',
            ' 01711 223344 ',
            '01711223344 ',
            ' 01711-223344',
        ];

        foreach ($variants as $index => $identifier) {
            $response = $this->postJson('/api/v1/auth/login', [
                'identifier' => $identifier,
                'password' => 'WrongPassword123!',
            ]);
            $this->assertNotEquals(429, $response->status(), "Attempt {$index} should not be throttled yet");
        }

        // 6th attempt with another variant should trigger 429
        $response = $this->postJson('/api/v1/auth/login', [
            'identifier' => '01711 223344',
            'password' => 'WrongPassword123!',
        ]);
        $response->assertStatus(429)
            ->assertJson([
                'status' => 429,
                'message' => 'auth.errors.tooManyAttempts',
            ]);
    }

    public function test_login_rate_limiter_is_isolated_per_identifier(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'identifier' => 'attacker_target@example.com',
                'password' => 'WrongPassword123!',
            ]);
        }

        // Attacker target is now throttled
        $blocked = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'attacker_target@example.com',
            'password' => 'WrongPassword123!',
        ]);
        $blocked->assertStatus(429);

        // Different identifier from different IP is NOT throttled
        $allowed = $this->withServerVariables(['REMOTE_ADDR' => '10.50.0.1'])
            ->postJson('/api/v1/auth/login', [
                'identifier' => 'innocent_user@example.com',
                'password' => 'WrongPassword123!',
            ]);
        $this->assertNotEquals(429, $allowed->status());
    }

    public function test_registration_rate_limiter_allows_ten_attempts(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $response = $this->postJson('/api/v1/auth/register', [
                'name' => "User {$i}",
                'email' => "user{$i}@example.com",
                'phone' => "017000000{$i}",
                'password' => 'Password123!',
                'role' => 'tenant',
            ]);
            $this->assertNotEquals(429, $response->status(), "Attempt {$i} should not be throttled");
        }

        $blocked = $this->postJson('/api/v1/auth/register', [
            'name' => 'User 11',
            'email' => 'user11@example.com',
            'phone' => '01700000099',
            'password' => 'Password123!',
            'role' => 'tenant',
        ]);
        $blocked->assertStatus(429)
            ->assertJson([
                'status' => 429,
                'message' => 'auth.errors.tooManyAttempts',
            ]);
    }

    public function test_forgot_password_rate_limiter_allows_three_attempts(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $response = $this->postJson('/api/v1/auth/forgot-password', [
                'email' => 'user@example.com',
            ]);
            $this->assertNotEquals(429, $response->status(), "Attempt {$i} should not be throttled");
        }

        $blocked = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'user@example.com',
        ]);
        $blocked->assertStatus(429)
            ->assertJson([
                'status' => 429,
                'message' => 'auth.errors.tooManyAttempts',
            ]);
    }

    public function test_reset_password_rate_limiter_allows_five_attempts(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/v1/auth/reset-password', [
                'email' => 'user@example.com',
                'token' => 'invalid-token',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ]);
            $this->assertNotEquals(429, $response->status(), "Attempt {$i} should not be throttled");
        }

        $blocked = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'user@example.com',
            'token' => 'invalid-token',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ]);
        $blocked->assertStatus(429)
            ->assertJson([
                'status' => 429,
                'message' => 'auth.errors.tooManyAttempts',
            ]);
    }

    public function test_verification_resend_rate_limiter_allows_three_attempts(): void
    {
        $this->seed(RoleSeeder::class);
        $user = User::factory()->create(['status' => 'active']);
        $token = $user->createToken('resend-test')->plainTextToken;

        for ($i = 0; $i < 3; $i++) {
            $response = $this->withToken($token)->postJson('/api/v1/auth/resend-code');
            $this->assertNotEquals(429, $response->status(), "Attempt {$i} should not be throttled");
        }

        $blocked = $this->withToken($token)->postJson('/api/v1/auth/resend-code');
        $blocked->assertStatus(429)
            ->assertJson([
                'status' => 429,
                'message' => 'auth.errors.tooManyAttempts',
            ]);
    }

    public function test_verify_email_route_is_throttled(): void
    {
        for ($i = 0; $i < 6; $i++) {
            $response = $this->get('/api/v1/auth/verify-email/1/invalidhash');
            $this->assertNotEquals(429, $response->status(), "Attempt {$i} should not be throttled");
        }

        $blocked = $this->get('/api/v1/auth/verify-email/1/invalidhash');
        $blocked->assertStatus(429);
    }

    public function test_active_sanctum_token_authenticates_successfully(): void
    {
        $this->seed(RoleSeeder::class);
        $user = User::factory()->create(['status' => 'active']);
        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/v1/auth/me');
        $response->assertStatus(200);
    }

    public function test_expired_sanctum_token_is_rejected(): void
    {
        $this->seed(RoleSeeder::class);
        $user = User::factory()->create(['status' => 'active']);
        $newAccessToken = $user->createToken('test_token');
        $plainToken = $newAccessToken->plainTextToken;

        // Backdate token creation timestamp beyond sanctum.expiration (1440 minutes)
        /** @var PersonalAccessToken $accessTokenModel */
        $accessTokenModel = $newAccessToken->accessToken;
        $accessTokenModel->forceFill([
            'created_at' => now()->subMinutes(1445),
        ])->saveQuietly();

        $response = $this->withToken($plainToken)->getJson('/api/v1/auth/me');
        $response->assertStatus(401)
            ->assertJson([
                'status' => 401,
                'message' => 'auth.errors.unauthenticated',
            ]);
    }

    public function test_revoked_token_is_rejected_after_logout(): void
    {
        $this->seed(RoleSeeder::class);
        $user = User::factory()->create(['status' => 'active']);
        $plainToken = $user->createToken('test_token')->plainTextToken;

        $logoutResponse = $this->withToken($plainToken)->postJson('/api/v1/auth/logout');
        $logoutResponse->assertStatus(200);

        // Verify token was deleted from database
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
        ]);

        // Reset in-memory auth guard cache for consecutive test request
        $this->app['auth']->forgetGuards();

        $meResponse = $this->withToken($plainToken)->getJson('/api/v1/auth/me');
        $meResponse->assertStatus(401);
    }

    public function test_security_headers_are_present_on_api_responses(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200);
        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
        $response->assertHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    }

    public function test_hsts_header_is_present_on_secure_requests(): void
    {
        $response = $this->get('https://localhost/api/v1/health');

        $response->assertStatus(200);
        $response->assertHeader('Strict-Transport-Security', 'max-age=31536000');
    }

    public function test_hsts_header_is_omitted_on_insecure_http_requests(): void
    {
        $response = $this->get('http://localhost/api/v1/health');

        $response->assertStatus(200);
        $response->assertHeaderMissing('Strict-Transport-Security');
    }

    public function test_trusted_proxy_forwarded_proto_enables_hsts(): void
    {
        // When trusted proxy (e.g. 127.0.0.1 / 10.0.1.5) forwards X-Forwarded-Proto: https, HTTPS detection activates HSTS
        $response = $this->withServerVariables(['REMOTE_ADDR' => '10.0.1.5'])
            ->withHeaders([
                'X-Forwarded-Proto' => 'https',
            ])->get('http://localhost/api/v1/health');

        $response->assertStatus(200);
        $response->assertHeader('Strict-Transport-Security', 'max-age=31536000');
    }

    public function test_untrusted_client_cannot_enable_hsts_via_forwarded_proto(): void
    {
        // Untrusted public IP (203.0.113.195) sending X-Forwarded-Proto: https must be rejected as untrusted
        $response = $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.195'])
            ->withHeaders([
                'X-Forwarded-Proto' => 'https',
            ])->get('http://localhost/api/v1/health');

        $response->assertStatus(200);
        $response->assertHeaderMissing('Strict-Transport-Security');
    }

    public function test_untrusted_client_cannot_spoof_client_ip_via_forwarded_for(): void
    {
        // Untrusted client sending X-Forwarded-For must have perceived IP match REMOTE_ADDR, not the spoofed header
        $response = $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.195'])
            ->withHeaders([
                'X-Forwarded-For' => '198.51.100.1',
            ])->getJson('/api/v1/health');

        $response->assertStatus(200);
        // Verify with rate limiter normalization or request IP resolution
        $req = \Illuminate\Http\Request::create('/api/v1/health', 'GET', [], [], [], [
            'REMOTE_ADDR' => '203.0.113.195',
            'HTTP_X_FORWARDED_FOR' => '198.51.100.1',
        ]);
        $this->assertEquals('203.0.113.195', $req->ip());
    }

    public function test_forwarded_host_cannot_override_application_host_unsafely(): void
    {
        // Even if X-Forwarded-Host: evil.com is sent, Symfony does not trust HEADER_X_FORWARDED_HOST
        $response = $this->withServerVariables(['REMOTE_ADDR' => '10.0.1.5'])
            ->withHeaders([
                'X-Forwarded-Host' => 'evil-attacker.com',
            ])->get('/api/v1/health');

        $response->assertStatus(200);
        $req = \Illuminate\Http\Request::create('http://localhost/api/v1/health', 'GET', [], [], [], [
            'REMOTE_ADDR' => '10.0.1.5',
            'HTTP_X_FORWARDED_HOST' => 'evil-attacker.com',
        ]);
        $this->assertEquals('localhost', $req->getHost());
    }

    public function test_trusted_proxy_correctly_resolves_client_ip_from_forwarded_for(): void
    {
        // When trusted proxy (10.0.1.5) forwards real user IP, Symfony correctly parses client IP
        $req = \Illuminate\Http\Request::create('http://localhost/api/v1/health', 'GET', [], [], [], [
            'REMOTE_ADDR' => '10.0.1.5',
            'HTTP_X_FORWARDED_FOR' => '203.0.113.195',
        ]);
        $this->assertEquals('203.0.113.195', $req->ip());
    }

    public function test_user_input_with_script_tags_is_stored_literally_without_html_execution(): void
    {
        $this->seed(RoleSeeder::class);
        $xssPayload = '<script>alert("xss")</script><img src=x onerror=alert(1)>';

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => $xssPayload,
            'email' => 'xss_tester@example.com',
            'phone' => '01700099999',
            'password' => 'Password123!',
            'role' => 'tenant',
        ]);

        $response->assertStatus(201);

        // Verify the database contains the exact literal string without stripping or executing
        $this->assertDatabaseHas('users', [
            'email' => 'xss_tester@example.com',
            'name' => $xssPayload,
        ]);

        // Verify response payload returns the exact literal string
        $this->assertEquals($xssPayload, $response->json('data.user.name'));
    }
}
