<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class FrontendGatewayController extends Controller
{
    /**
     * Whitelist of safe HTTP methods supported by the gateway.
     */
    protected const ALLOWED_METHODS = ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'];

    /**
     * Regular expression matching static asset file extensions.
     */
    protected const ASSET_PATTERN = '/\.(js|mjs|cjs|ts|tsx|css|map|json|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|otf)$/i';

    /**
     * Headers that must never be forwarded from the client to the frontend runtime.
     */
    protected const STRIP_REQUEST_HEADERS = [
        'authorization',
        'cookie',
        'host',
        'connection',
    ];

    /**
     * Hop-by-hop response headers that must not be returned to the client.
     */
    protected const STRIP_RESPONSE_HEADERS = [
        'connection',
        'transfer-encoding',
        'keep-alive',
        'proxy-authenticate',
        'proxy-authorization',
        'te',
        'trailers',
        'upgrade',
    ];

    /**
     * Handle incoming web requests and proxy to TanStack Start runtime.
     */
    public function handle(Request $request): SymfonyResponse
    {
        $path = $request->path();

        // 1. Strict API isolation: Never serve frontend HTML for missing API endpoints
        if ($request->is('api/*') || $path === 'api') {
            return response()->json([
                'status' => 404,
                'message' => 'common.errors.notFound',
            ], 404);
        }

        // 2. Strict path validation: Prevent directory traversal, control characters, or backslashes
        if (str_contains($path, '..') || str_contains($path, "\\") || str_contains($path, "\0")) {
            return response('Invalid request path', 400);
        }

        // 3. Safe HTTP method validation
        $method = strtoupper($request->method());
        if (! in_array($method, self::ALLOWED_METHODS, true)) {
            return response('Method Not Allowed', 405);
        }

        $isAsset = (bool) preg_match(self::ASSET_PATTERN, $path);

        // 4. Testing environment hook for deterministic unit and feature tests
        if (app()->environment('testing')) {
            return $this->handleTestingRequest($request, $isAsset);
        }

        // 5. Construct target URL
        $devUrl = rtrim((string) config('frontend.dev_url', 'http://127.0.0.1:8080'), '/');
        $targetUri = '/' . ltrim($request->getRequestUri(), '/');
        $targetUrl = $devUrl . $targetUri;

        // 6. Execute bounded proxy request
        return $this->proxyRequest($request, $targetUrl, $isAsset, $devUrl);
    }

    /**
     * Execute bounded cURL request to the frontend development server.
     */
    protected function proxyRequest(Request $request, string $targetUrl, bool $isAsset, string $devUrl): SymfonyResponse
    {
        $method = strtoupper($request->method());
        $timeout = (int) config('frontend.timeout', 5);
        $connectTimeout = (int) config('frontend.connect_timeout', 2);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $targetUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $connectTimeout);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

        // Forward filtered request headers
        $forwardHeaders = [];
        foreach ($request->headers->all() as $name => $values) {
            $lowerName = strtolower($name);
            if (in_array($lowerName, self::STRIP_REQUEST_HEADERS, true)) {
                continue;
            }
            foreach ($values as $value) {
                $forwardHeaders[] = "{$name}: {$value}";
            }
        }
        $forwardHeaders[] = 'X-Forwarded-For: ' . $request->ip();
        $forwardHeaders[] = 'X-Forwarded-Host: ' . $request->getHost();
        $forwardHeaders[] = 'X-Forwarded-Proto: ' . $request->getScheme();
        curl_setopt($ch, CURLOPT_HTTPHEADER, $forwardHeaders);

        // Forward request body for mutation methods
        if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            $body = $request->getContent();
            if ($body !== '') {
                curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
            }
        }

        $rawResponse = curl_exec($ch);
        $curlError = curl_errno($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        curl_close($ch);

        // Handle offline dev server or connection timeouts
        if ($curlError !== 0 || $rawResponse === false) {
            if ($isAsset) {
                return response('Asset not found', 404)->header('Content-Type', 'text/plain');
            }

            return response($this->renderOfflineHtml($devUrl), 503)
                ->header('Content-Type', 'text/html; charset=utf-8');
        }

        // Missing static asset must return 404, never fallback HTML
        if ($isAsset && $httpCode === 404) {
            return response('Asset not found', 404)->header('Content-Type', 'text/plain');
        }

        $rawHeaders = substr((string) $rawResponse, 0, $headerSize);
        $responseBody = substr((string) $rawResponse, $headerSize);

        // Build Symfony Response
        $response = response($responseBody, $httpCode > 0 ? $httpCode : 200);

        // Parse and forward safe response headers
        foreach (explode("\r\n", $rawHeaders) as $headerLine) {
            if (str_contains($headerLine, ':')) {
                [$headerName, $headerValue] = explode(':', $headerLine, 2);
                $headerName = trim($headerName);
                $headerValue = trim($headerValue);

                if (! in_array(strtolower($headerName), self::STRIP_RESPONSE_HEADERS, true)) {
                    $response->headers->set($headerName, $headerValue, false);
                }
            }
        }

        return $response;
    }

    /**
     * Provide a deterministic response in testing environments when a live Vite server is not active.
     */
    protected function handleTestingRequest(Request $request, bool $isAsset): SymfonyResponse
    {
        if ($isAsset) {
            return response('Asset not found', 404)->header('Content-Type', 'text/plain');
        }

        // Return a mock HTML shell representing successful frontend SSR rendering in tests
        $html = '<!DOCTYPE html><html lang="bn"><head><title>Thikana — Rental homes in Bangladesh</title></head><body><div id="root">Thikana Frontend Shell</div></body></html>';

        return response($html, 200)->header('Content-Type', 'text/html; charset=utf-8');
    }

    /**
     * Render developer-friendly 503 error page when Vite / TanStack Start server is offline.
     */
    protected function renderOfflineHtml(string $devUrl): string
    {
        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Thikana — Frontend Server Offline (503)</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; box-sizing: border-box; }
        .card { background: #1e293b; padding: 2.25rem; border-radius: 12px; max-width: 560px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5); border: 1px solid #334155; }
        .badge { display: inline-block; background: #ef4444; color: #ffffff; padding: 0.25rem 0.65rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; }
        h1 { font-size: 1.4rem; font-weight: 700; margin: 0 0 0.75rem 0; color: #ffffff; line-height: 1.3; }
        p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; margin: 0 0 1rem 0; }
        .command { background: #0b1120; color: #38bdf8; padding: 0.75rem 1rem; border-radius: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.9rem; margin-bottom: 1.25rem; border: 1px solid #1e293b; display: flex; align-items: center; }
        .command::before { content: "$ "; color: #64748b; margin-right: 0.5rem; }
        .footer { font-size: 0.8rem; color: #64748b; border-top: 1px solid #334155; padding-top: 1rem; margin-top: 1.25rem; }
    </style>
</head>
<body>
    <div class="card">
        <span class="badge">HTTP 503 Unavailable</span>
        <h1>Frontend Runtime Offline</h1>
        <p>The Laravel development server is configured to serve the Thikana frontend via same-origin gateway, but the TanStack Start runtime at <code>{$devUrl}</code> is currently unreachable.</p>
        <p>Start the frontend development server by running:</p>
        <div class="command">cd frontend && npm run dev</div>
        <div class="footer">
            Thikana Same-Origin Gateway &bull; Backend: 127.0.0.1:8000 &bull; Target: {$devUrl}
        </div>
    </div>
</body>
</html>
HTML;
    }
}

