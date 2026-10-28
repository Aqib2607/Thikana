<?php

use App\Http\Controllers\Api\V1\Admin\AdminCommunityController;
use App\Http\Controllers\Api\V1\Admin\AdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\AdminPropertyController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\Landlord\LandlordContactRequestController;
use App\Http\Controllers\Api\V1\Landlord\LandlordImageController;
use App\Http\Controllers\Api\V1\Landlord\LandlordPropertyController;
use App\Http\Controllers\Api\V1\Landlord\LandlordVisitRequestController;
use App\Http\Controllers\Api\V1\PropertyController;
use App\Http\Controllers\Api\V1\Tenant\ContactRequestController as TenantContactRequestController;
use App\Http\Controllers\Api\V1\Tenant\VisitRequestController as TenantVisitRequestController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - V1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Service health check
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'service' => 'Thikana API',
            'version' => '1.0.0',
            'timestamp' => now()->toISOString(),
        ]);
    });

    // Public Auth Endpoints
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);
        Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
        Route::post('/resend-code', [AuthController::class, 'resendCode']);

        // Protected Auth Endpoints (Requires valid Sanctum token & active account status)
        Route::middleware(['auth:sanctum', 'active'])->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::post('/logout-all', [AuthController::class, 'logoutAll']);
        });
    });

    // Public Property Discovery & Catalogs
    Route::prefix('properties')->group(function () {
        Route::get('/', [PropertyController::class, 'index']);
        Route::get('/areas', [PropertyController::class, 'areas']);
        Route::get('/amenities', [PropertyController::class, 'amenities']);
        Route::get('/{idOrSlug}', [PropertyController::class, 'show']);
    });

    // Tenant Protected Endpoints
    Route::middleware(['auth:sanctum', 'role:tenant', 'active'])->group(function () {
        Route::prefix('tenant')->group(function () {
            Route::get('/contact-requests', [TenantContactRequestController::class, 'index']);
            Route::get('/visits', [TenantVisitRequestController::class, 'index']);
            Route::patch('/visits/{id}/cancel', [TenantVisitRequestController::class, 'cancel']);
        });
        Route::post('/properties/{id}/contact', [TenantContactRequestController::class, 'store'])
            ->middleware('throttle:5,1');
        Route::post('/properties/{id}/visits', [TenantVisitRequestController::class, 'store'])
            ->middleware('throttle:5,1');
    });

    // Landlord Protected Endpoints
    Route::middleware(['auth:sanctum', 'role:landlord', 'active'])->prefix('landlord')->group(function () {
        Route::get('/stats', [LandlordPropertyController::class, 'stats']);

        Route::prefix('contact-requests')->group(function () {
            Route::get('/', [LandlordContactRequestController::class, 'index']);
            Route::patch('/{id}/status', [LandlordContactRequestController::class, 'updateStatus']);
        });

        Route::prefix('visits')->group(function () {
            Route::get('/', [LandlordVisitRequestController::class, 'index']);
            Route::patch('/{id}/status', [LandlordVisitRequestController::class, 'updateStatus']);
        });

        Route::prefix('properties')->group(function () {
            Route::get('/', [LandlordPropertyController::class, 'index']);
            Route::post('/', [LandlordPropertyController::class, 'store']);
            Route::get('/{id}', [LandlordPropertyController::class, 'show']);
            Route::put('/{id}', [LandlordPropertyController::class, 'update']);
            Route::delete('/{id}', [LandlordPropertyController::class, 'destroy']);

            Route::patch('/{id}/availability', [LandlordPropertyController::class, 'updateAvailability']);
            Route::patch('/{id}/contact-visibility', [LandlordPropertyController::class, 'updateContactVisibility']);

            // Dedicated Image Management
            Route::post('/{id}/images', [LandlordImageController::class, 'store']);
            Route::delete('/{id}/images/{imageId}', [LandlordImageController::class, 'destroy']);
            Route::put('/{id}/images/reorder', [LandlordImageController::class, 'reorder']);
        });
    });

    // Admin Moderation & Governance Endpoints
    Route::middleware(['auth:sanctum', 'role:admin', 'active'])->prefix('admin')->group(function () {
        Route::get('/dashboard/stats', [AdminDashboardController::class, 'stats']);
        Route::get('/audit-logs', [AdminDashboardController::class, 'auditLogs']);
        Route::get('/properties', [AdminPropertyController::class, 'index']);
        Route::post('/properties/{id}/approve', [AdminPropertyController::class, 'approve']);
        Route::post('/properties/{id}/reject', [AdminPropertyController::class, 'reject']);
        Route::put('/properties/{id}/verifications', [AdminPropertyController::class, 'updateVerifications']);
        Route::get('/community', [AdminCommunityController::class, 'index']);
        Route::put('/community/{areaName}', [AdminCommunityController::class, 'update']);
    });
});
