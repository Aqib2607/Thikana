<?php

namespace Tests\Feature;

use App\Http\Controllers\FrontendGatewayController;
use Illuminate\Http\Request;
use Tests\TestCase;

class FrontendRoutingTest extends TestCase
{
    public function test_root_url_routes_to_frontend_gateway(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/html', (string) $response->headers->get('Content-Type'));
        $this->assertStringContainsString('Thikana', $response->getContent());
    }

    public function test_direct_nested_frontend_routes_route_to_gateway_without_404(): void
    {
        $routes = [
            '/login',
            '/register',
            '/properties',
            '/tenant/visits',
            '/landlord/visits',
        ];

        foreach ($routes as $route) {
            $response = $this->get($route);
            $response->assertStatus(200);
            $this->assertStringContainsString('text/html', (string) $response->headers->get('Content-Type'));
        }
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

    public function test_existing_api_endpoints_take_precedence_over_frontend_gateway(): void
    {
        // 1. Check health endpoint
        $healthResponse = $this->getJson('/api/v1/health');
        $healthResponse->assertStatus(200);
        $healthResponse->assertJson(['status' => 'ok']);

        // 2. Check property discovery endpoint
        $propertiesResponse = $this->getJson('/api/v1/properties');
        $propertiesResponse->assertStatus(200);
        $this->assertStringContainsString('application/json', (string) $propertiesResponse->headers->get('Content-Type'));
        $propertiesResponse->assertJsonStructure([
            'data',
            'total',
            'page',
        ]);
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

    public function test_offline_dev_server_returns_503_for_page_requests(): void
    {
        $controller = new class extends FrontendGatewayController {
            public function testProxy(Request $request, string $url, bool $isAsset, string $devUrl) {
                return $this->proxyRequest($request, $url, $isAsset, $devUrl);
            }
        };

        // Use a 1ms timeout for immediate offline detection in test
        config(['frontend.connect_timeout' => 1, 'frontend.timeout' => 1]);

        $request = Request::create('/', 'GET');
        $response = $controller->testProxy($request, 'http://127.0.0.1:59999/', false, 'http://127.0.0.1:59999');

        $this->assertEquals(503, $response->getStatusCode());
        $this->assertStringContainsString('text/html', (string) $response->headers->get('Content-Type'));
        $this->assertStringContainsString('Frontend Runtime Offline', (string) $response->getContent());
    }

    public function test_offline_dev_server_returns_404_for_asset_requests(): void
    {
        $controller = new class extends FrontendGatewayController {
            public function testProxy(Request $request, string $url, bool $isAsset, string $devUrl) {
                return $this->proxyRequest($request, $url, $isAsset, $devUrl);
            }
        };

        config(['frontend.connect_timeout' => 1, 'frontend.timeout' => 1]);

        $request = Request::create('/assets/missing.js', 'GET');
        $response = $controller->testProxy($request, 'http://127.0.0.1:59999/assets/missing.js', true, 'http://127.0.0.1:59999');

        $this->assertEquals(404, $response->getStatusCode());
        $this->assertStringContainsString('Asset not found', (string) $response->getContent());
    }
}
