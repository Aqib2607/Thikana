<?php

$frontendUrlEnv = env('FRONTEND_URL', '');
$customOrigins = array_filter(array_map('trim', explode(',', (string) $frontendUrlEnv)));
$customOrigins = array_map(fn (string $url) => rtrim($url, '/'), $customOrigins);

$isProduction = env('APP_ENV') === 'production';

$defaultOrigins = $isProduction ? [] : [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
];

$allowedOrigins = array_values(array_unique(array_filter(array_merge($defaultOrigins, $customOrigins))));

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Whitelists local development frontends (Vite port 5173 / Next port 3000)
    | and explicit production domains configured via FRONTEND_URL.
    | Wildcard subdomain patterns and unnecessary credentials are restricted.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $allowedOrigins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => false,

];

