<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request and apply defensive HTTP security headers.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Generate a cryptographically secure request-scoped CSP nonce
        $nonce = base64_encode(random_bytes(16));
        $request->attributes->set('csp_nonce', $nonce);

        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

        if ($request->is('api/*') || $request->path() === 'api') {
            // Strict API isolation: Zero external execution permitted
            $response->headers->set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
        } elseif (! $response->headers->has('Content-Security-Policy')) {
            // Defense-in-depth web CSP with strict nonce-based script execution (no unsafe-inline scripts)
            $response->headers->set(
                'Content-Security-Policy',
                "default-src 'self'; script-src 'self' 'nonce-{$nonce}' 'sha256-7T/FUXIAyHDjFHcW7oz6/ZitXke0/3QU+rwq7K0sytI='; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://images.unsplash.com; frame-src 'self' https://www.openstreetmap.org; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
            );
        }

        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000');
        }

        return $response;
    }
}
