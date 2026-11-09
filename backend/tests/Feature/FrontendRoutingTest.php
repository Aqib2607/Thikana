<?php

namespace Tests\Feature;

use Tests\TestCase;

class FrontendRoutingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Point static_dir to the built frontend output for deterministic testing
        config([
            'frontend.mode' => 'auto',
            'frontend.backend_only' => false,
            'frontend.static_dir' => realpath(base_path('../frontend/.output/public')) ?: base_path('../frontend/.output/public'),
        ]);
    }

    public function test_root_url_routes_to_frontend_gateway(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/html', (string) $response->headers->get('Content-Type'));
        $this->assertStringContainsString('Thikana', (string) $response->getContent());
    }

    public function test_direct_nested_frontend_routes_route_to_gateway_without_404(): void
    {
        $routes = [
            '/properties',
            '/login',
            '/register',
            '/tenant/dashboard',
            '/landlord/dashboard',
            '/admin/dashboard',
        ];

        foreach ($routes as $route) {
            $response = $this->get($route);
            $response->assertStatus(200);
            $this->assertStringContainsString('text/html', (string) $response->headers->get('Content-Type'));
            $this->assertStringContainsString('Thikana', (string) $response->getContent());
        }
    }

    public function test_static_frontend_injects_script_nonce_and_sets_safe_csp(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $csp = (string) $response->headers->get('Content-Security-Policy');

        // CSP MUST NOT contain unsafe-inline for scripts
        $this->assertStringNotContainsString("script-src 'self' 'unsafe-inline'", $csp);
        $this->assertStringContainsString("script-src 'self' 'nonce-", $csp);
        $this->assertStringContainsString('https://fonts.googleapis.com', $csp);
        $this->assertStringContainsString('https://fonts.gstatic.com', $csp);
        $this->assertStringContainsString('https://images.unsplash.com', $csp);
        $this->assertStringContainsString('https://www.openstreetmap.org', $csp);

        // Scripts in the HTML must carry the nonce attribute
        $content = (string) $response->getContent();
        $this->assertMatchesRegularExpression('/<script nonce="[A-Za-z0-9+\/=]+"/', $content);
    }

    public function test_missing_api_endpoints_return_json_404_not_frontend_html(): void
    {
        $response = $this->getJson('/api/v1/nonexistent-test-endpoint');

        $response->assertStatus(404);
        $response->assertJson([
            'status' => 404,
            'message' => 'common.errors.notFound',
        ]);
        $this->assertStringContainsString('application/json', (string) $response->headers->get('Content-Type'));
    }

    public function test_existing_api_endpoints_take_precedence_and_maintain_strict_api_csp(): void
    {
        // 1. Health endpoint
        $healthResponse = $this->getJson('/api/v1/health');
        $healthResponse->assertStatus(200);
        $healthResponse->assertJson(['status' => 'ok']);
        $this->assertEquals("default-src 'none'; frame-ancestors 'none'", $healthResponse->headers->get('Content-Security-Policy'));

        // 2. Catalog endpoint
        $propertiesResponse = $this->getJson('/api/v1/properties/areas');
        $propertiesResponse->assertStatus(200);
        $this->assertStringContainsString('application/json', (string) $propertiesResponse->headers->get('Content-Type'));
        $this->assertEquals("default-src 'none'; frame-ancestors 'none'", $propertiesResponse->headers->get('Content-Security-Policy'));
    }

    public function test_existing_static_assets_are_served_with_correct_mime_types(): void
    {
        // Favicon exists in .output/public
        $response = $this->get('/favicon.ico');
        if ($response->getStatusCode() === 200) {
            $this->assertStringContainsString('image/x-icon', (string) $response->headers->get('Content-Type'));
        }

        // Check CSS bundle if present
        $staticDir = (string) config('frontend.static_dir');
        $cssFiles = glob($staticDir.'/assets/*.css');
        if (! empty($cssFiles)) {
            $cssRelative = '/assets/'.basename($cssFiles[0]);
            $cssResponse = $this->get($cssRelative);
            $cssResponse->assertStatus(200);
            $this->assertStringContainsString('text/css', (string) $cssResponse->headers->get('Content-Type'));
        }
    }

    public function test_missing_static_assets_return_404_not_html(): void
    {
        $assets = [
            '/assets/nonexistent-bundle.js',
            '/assets/styles-missing.css',
            '/images/nonexistent-photo.png',
        ];

        foreach ($assets as $asset) {
            $response = $this->get($asset);
            $response->assertStatus(404);
            $this->assertStringNotContainsString('text/html', (string) $response->headers->get('Content-Type'));
            $this->assertStringContainsString('Asset not found', (string) $response->getContent());
        }
    }

    public function test_static_asset_serves_block_prohibited_extensions(): void
    {
        $blocked = [
            '/assets/malicious.php',
            '/assets/.env',
            '/assets/backup.sql',
        ];

        foreach ($blocked as $path) {
            $response = $this->get($path);
            $response->assertStatus(404);
            $this->assertStringContainsString('Asset not found', (string) $response->getContent());
        }
    }

    public function test_traversal_paths_are_rejected(): void
    {
        $response = $this->get('/../etc/passwd');

        // Path containing '..' is rejected with 400
        $response->assertStatus(400);
    }

    public function test_disallowed_http_methods_are_rejected(): void
    {
        $response = $this->call('TRACE', '/');

        $response->assertStatus(405);
    }

    public function test_explicit_backend_only_mode_returns_200_without_serving_frontend(): void
    {
        config(['frontend.backend_only' => true]);

        $response = $this->get('/');
        $response->assertStatus(200);
        $this->assertStringContainsString('text/html', (string) $response->headers->get('Content-Type'));
        $this->assertStringContainsString('Thikana Laravel Backend Running', (string) $response->getContent());
    }

    public function test_backend_only_mode_returns_json_when_requested(): void
    {
        config(['frontend.backend_only' => true]);

        $response = $this->getJson('/');
        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'online',
            'mode' => 'backend-only',
            'service' => 'Thikana API',
        ]);
    }
}
