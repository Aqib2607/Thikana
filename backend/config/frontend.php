<?php

return [
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
    | Gateway Timeout (seconds)
    |--------------------------------------------------------------------------
    |
    | Bounded timeouts for proxy requests to prevent hanging worker threads.
    |
    */
    'timeout' => (int) env('FRONTEND_GATEWAY_TIMEOUT', 5),
    'connect_timeout' => (int) env('FRONTEND_GATEWAY_CONNECT_TIMEOUT', 2),
];

