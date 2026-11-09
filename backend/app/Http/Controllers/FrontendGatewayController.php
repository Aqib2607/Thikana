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
     * MIME types mapping for supported static frontend assets.
     */
    protected const ASSET_MIME_TYPES = [
        'js' => 'application/javascript',
        'mjs' => 'application/javascript',
        'cjs' => 'application/javascript',
        'css' => 'text/css',
        'map' => 'application/json',
        'json' => 'application/json',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon',
        'webp' => 'image/webp',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'eot' => 'application/vnd.ms-fontobject',
        'otf' => 'font/otf',
    ];

    /**
     * Extensions strictly forbidden from being served as static assets.
     */
    protected const BLOCKED_EXTENSIONS = [
        'php', 'env', 'sql', 'sh', 'bat', 'cmd', 'lock', 'gitignore', 'htaccess', 'git', 'yml', 'yaml',
    ];

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
     * Handle incoming web requests and serve static build or proxy to dev runtime.
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
        if (str_contains($path, '..') || str_contains($path, '\\') || str_contains($path, "\0")) {
            return response('Invalid request path', 400);
        }

        // 3. Safe HTTP method validation
        $method = strtoupper($request->method());
        if (! in_array($method, self::ALLOWED_METHODS, true)) {
            return response('Method Not Allowed', 405);
        }

        // Determine if request is targeting a static asset
        $isAsset = $request->is('assets/*')
            || (bool) preg_match(self::ASSET_PATTERN, $path)
            || (str_contains(basename($path), '.') && ! in_array(strtolower(pathinfo($path, PATHINFO_EXTENSION)), ['', 'html', 'htm'], true));

        $mode = (string) config('frontend.mode', 'auto');
        $backendOnly = (bool) config('frontend.backend_only', false);

        // 4. Fast-path: Explicit backend-only development mode
        if ($backendOnly || $mode === 'backend_only') {
            if ($isAsset) {
                return response('Asset not found', 404)->header('Content-Type', 'text/plain');
            }

            return $this->renderBackendOnlyResponse($request);
        }

        // 5. Static-First Serving Path (for 'auto' or 'static' modes)
        if ($mode === 'auto' || $mode === 'static') {
            $staticDir = (string) config('frontend.static_dir');
            $canonicalDir = realpath($staticDir);

            if ($canonicalDir !== false && is_dir($canonicalDir)) {
                if ($isAsset) {
                    return $this->serveStaticAsset($canonicalDir, $path);
                }

                $indexPath = $canonicalDir.DIRECTORY_SEPARATOR.'index.html';
                if (is_file($indexPath)) {
                    return $this->serveStaticHtml($request, $indexPath);
                }

                // If strictly in static mode and index.html is missing, return backend status
                if ($mode === 'static') {
                    return $this->renderBackendOnlyResponse($request);
                }
            } elseif ($isAsset) {
                return response('Asset not found', 404)->header('Content-Type', 'text/plain');
            }
        }

        // 6. Testing environment hook for deterministic unit and feature tests
        if (app()->environment('testing')) {
            return $this->handleTestingRequest($request, $isAsset);
        }

        // 7. Proxy fallback for live development server
        $devUrl = rtrim((string) config('frontend.dev_url', 'http://127.0.0.1:8080'), '/');
        $targetUri = '/'.ltrim($request->getRequestUri(), '/');
        $targetUrl = $devUrl.$targetUri;

        return $this->proxyRequest($request, $targetUrl, $isAsset, $devUrl);
    }

    /**
     * Safely resolve and serve a static asset within the canonical static directory.
     */
    protected function serveStaticAsset(string $canonicalDir, string $path): SymfonyResponse
    {
        $normalizedRelative = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, ltrim($path, '/'));
        $baseName = basename($normalizedRelative);

        // Reject dotfiles (.env, .git, etc.)
        if (str_starts_with($baseName, '.')) {
            return response('Asset not found', 404)->header('Content-Type', 'text/plain');
        }

        $extension = strtolower(pathinfo($baseName, PATHINFO_EXTENSION));

        // Reject forbidden extensions or unmapped MIME types immediately
        if (in_array($extension, self::BLOCKED_EXTENSIONS, true) || ! isset(self::ASSET_MIME_TYPES[$extension])) {
            return response('Asset not found', 404)->header('Content-Type', 'text/plain');
        }

        $candidatePath = realpath($canonicalDir.DIRECTORY_SEPARATOR.$normalizedRelative);

        // Enforce strict directory bounds check
        if ($candidatePath === false || ! str_starts_with($candidatePath, $canonicalDir.DIRECTORY_SEPARATOR) || ! is_file($candidatePath)) {
            return response('Asset not found', 404)->header('Content-Type', 'text/plain');
        }

        $mimeType = self::ASSET_MIME_TYPES[$extension];
        $isHashedAsset = str_starts_with($normalizedRelative, 'assets'.DIRECTORY_SEPARATOR);
        $cacheControl = $isHashedAsset
            ? 'public, max-age=31536000, immutable'
            : 'public, max-age=3600, must-revalidate';

        return response()->file($candidatePath, [
            'Content-Type' => $mimeType,
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => $cacheControl,
        ]);
    }

    /**
     * Serve the compiled static index.html with per-request CSP nonce injection.
     */
    protected function serveStaticHtml(Request $request, string $indexPath): SymfonyResponse
    {
        $html = file_get_contents($indexPath);
        if ($html === false) {
            return response('Error reading frontend build', 500);
        }

        // Retrieve or generate cryptographically secure nonce
        /** @var string $nonce */
        $nonce = $request->attributes->get('csp_nonce') ?: base64_encode(random_bytes(16));

        // Inject the request nonce into all inline and module script tags
        $securedHtml = preg_replace('/<script(\s|>)/i', '<script nonce="'.$nonce.'"$1', $html);
        if (! is_string($securedHtml)) {
            $securedHtml = $html;
        }

        $csp = "default-src 'self'; script-src 'self' 'nonce-{$nonce}' 'sha256-7T/FUXIAyHDjFHcW7oz6/ZitXke0/3QU+rwq7K0sytI='; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://images.unsplash.com; frame-src 'self' https://www.openstreetmap.org; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';";

        return response($securedHtml, 200, [
            'Content-Type' => 'text/html; charset=utf-8',
            'Content-Security-Policy' => $csp,
            'X-Frame-Options' => 'DENY',
            'X-Content-Type-Options' => 'nosniff',
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
            'Permissions-Policy' => 'camera=(), microphone=(), geolocation=(self)',
            'Cache-Control' => 'no-cache, must-revalidate',
        ]);
    }

    /**
     * Execute bounded cURL request to the frontend development server.
     */
    public function proxyRequest(Request $request, string $targetUrl, bool $isAsset, string $devUrl): SymfonyResponse
    {
        $method = strtoupper($request->method());
        $timeout = (int) config('frontend.timeout', 5);
        $connectTimeout = (int) config('frontend.connect_timeout', 2);

        $ch = curl_init();
        $targetUrlString = $targetUrl !== '' ? $targetUrl : 'http://127.0.0.1:8080';
        $methodString = $method !== '' ? $method : 'GET';
        curl_setopt($ch, CURLOPT_URL, $targetUrlString);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $connectTimeout);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $methodString);

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
        $forwardHeaders[] = 'X-Forwarded-For: '.$request->ip();
        $forwardHeaders[] = 'X-Forwarded-Host: '.$request->getHost();
        $forwardHeaders[] = 'X-Forwarded-Proto: '.$request->getScheme();
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

            return $this->renderBackendOnlyResponse($request);
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
     * Provide a deterministic response in testing environments when live Vite/static is absent.
     */
    protected function handleTestingRequest(Request $request, bool $isAsset): SymfonyResponse
    {
        if ($isAsset) {
            return response('Asset not found', 404)->header('Content-Type', 'text/plain');
        }

        $html = '<!DOCTYPE html><html lang="bn"><head><title>Thikana — Rental homes in Bangladesh</title></head><body><div id="root">Thikana Frontend Shell</div></body></html>';

        return response($html, 200)->header('Content-Type', 'text/html; charset=utf-8');
    }

    /**
     * Render clean backend-only response when Vite frontend is not running or not needed.
     */
    protected function renderBackendOnlyResponse(Request $request): SymfonyResponse
    {
        if ($request->expectsJson()) {
            return response()->json([
                'status' => 'online',
                'mode' => 'backend-only',
                'service' => 'Thikana API',
                'version' => '1.0.0',
                'health' => url('/api/v1/health'),
            ], 200);
        }

        $healthUrl = url('/api/v1/health');
        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Thikana — Backend API Service (Active)</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; box-sizing: border-box; }
        .card { background: #1e293b; padding: 2.25rem; border-radius: 12px; max-width: 580px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5); border: 1px solid #334155; }
        .badge { display: inline-block; background: #10b981; color: #ffffff; padding: 0.25rem 0.65rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; }
        h1 { font-size: 1.4rem; font-weight: 700; margin: 0 0 0.75rem 0; color: #ffffff; line-height: 1.3; }
        p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; margin: 0 0 1rem 0; }
        .link-box { background: #0b1120; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #1e293b; margin-bottom: 1.25rem; }
        .link-box a { color: #38bdf8; text-decoration: none; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.9rem; }
        .link-box a:hover { text-decoration: underline; }
        .footer { font-size: 0.8rem; color: #64748b; border-top: 1px solid #334155; padding-top: 1rem; margin-top: 1.25rem; }
    </style>
</head>
<body>
    <div class="card">
        <span class="badge">Backend Active &bull; HTTP 200</span>
        <h1>Thikana Laravel Backend Running</h1>
        <p>The Laravel backend service is running in <strong>backend-only development mode</strong>. The React/Vite development server is not running and is not required for backend API development.</p>
        <p>API endpoints under <code>/api/v1</code> are fully active and testable:</p>
        <div class="link-box"><a href="{$healthUrl}">{$healthUrl}</a></div>
        <div class="footer">
            Thikana Backend Service &bull; Environment: local &bull; Port: 8000
        </div>
    </div>
</body>
</html>
HTML;

        return response($html, 200)->header('Content-Type', 'text/html; charset=utf-8');
    }
}
