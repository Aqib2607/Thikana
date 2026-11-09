<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Frontend Serving Mode
    |--------------------------------------------------------------------------
    |
    | Supported modes:
    |   - 'auto'        : Static build if available, otherwise proxy/backend status
    |   - 'static'      : Strictly serve compiled static build from static_dir
    |   - 'proxy'       : Strictly proxy to FRONTEND_DEV_URL via cURL
    |   - 'backend_only': Strictly serve backend API status page
    |
    */
    'mode' => env('FRONTEND_MODE', 'auto'),

    /*
    |--------------------------------------------------------------------------
    | Frontend Static Build Directory
    |--------------------------------------------------------------------------
    |
    | Absolute path to the directory containing compiled static frontend assets
    | and index.html. Defaults to frontend/.output/public.
    |
    */
    'static_dir' => env('FRONTEND_STATIC_DIR', realpath(base_path('../frontend/.output/public')) ?: base_path('../frontend/.output/public')),

    /*
    |--------------------------------------------------------------------------
    | Frontend Development Server URL
    |--------------------------------------------------------------------------
    |
    | Defines the URL of the running TanStack Start / Vite development server
    | used for same-origin proxying in local development.
    |
    */
    'dev_url' => env('FRONTEND_DEV_URL', 'http://127.0.0.1:8080'),

    /*
    |--------------------------------------------------------------------------
    | Backend-Only Development Mode
    |--------------------------------------------------------------------------
    |
    | When enabled, browser requests to non-API web routes immediately receive
    | a backend status response (HTTP 200) without attempting to proxy to Vite.
    |
    */
    'backend_only' => (bool) env('FRONTEND_BACKEND_ONLY', false),

    /*
    |--------------------------------------------------------------------------
    | Gateway Timeout (seconds)
    |--------------------------------------------------------------------------
    |
    | Bounded timeouts for proxy requests to prevent hanging worker threads.
    |
    */
    'timeout' => (int) env('FRONTEND_GATEWAY_TIMEOUT', 5),
    'connect_timeout' => (int) env('FRONTEND_GATEWAY_CONNECT_TIMEOUT', 2),
];
