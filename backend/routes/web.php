<?php

use App\Http\Controllers\FrontendGatewayController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes - Same-Origin Frontend Integration
|--------------------------------------------------------------------------
|
| Primary entry points for the Thikana frontend application. Non-API web
| requests are routed to the frontend runtime, preserving same-origin
| semantics for authentication, API calls, and nested client routes.
|
*/

Route::get('/', [FrontendGatewayController::class, 'handle'])->name('home');
Route::fallback([FrontendGatewayController::class, 'handle'])->name('frontend.fallback');
