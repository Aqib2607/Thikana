<?php

use App\Http\Controllers\Api\V1\Admin\AdminCommunityController;
use App\Http\Controllers\Api\V1\Admin\AdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\AdminPropertyController;
use App\Http\Controllers\Api\V1\Admin\AdminReportController;
use App\Http\Controllers\Api\V1\Admin\AdminReviewController;
use App\Http\Controllers\Api\V1\Admin\AdminUserController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ConversationController;
use App\Http\Controllers\Api\V1\Landlord\LandlordContactRequestController;
use App\Http\Controllers\Api\V1\Landlord\LandlordImageController;
use App\Http\Controllers\Api\V1\Landlord\LandlordPropertyController;
use App\Http\Controllers\Api\V1\Landlord\LandlordVisitRequestController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PropertyController;
use App\Http\Controllers\Api\V1\PropertyReviewController;
use App\Http\Controllers\Api\V1\Tenant\ComparisonController as TenantComparisonController;
use App\Http\Controllers\Api\V1\Tenant\ContactRequestController as TenantContactRequestController;
use App\Http\Controllers\Api\V1\Tenant\FavoriteController as TenantFavoriteController;
use App\Http\Controllers\Api\V1\Tenant\PropertyReportController as TenantPropertyReportController;
use App\Http\Controllers\Api\V1\Tenant\RentalPreferenceController;
use App\Http\Controllers\Api\V1\Tenant\ReviewController as TenantReviewController;
use App\Http\Controllers\Api\V1\Tenant\TenantDashboardController;
use App\Http\Controllers\Api\V1\Tenant\VisitRequestController as TenantVisitRequestController;
use App\Http\Middleware\OptionalSanctumAuth;
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
        Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:registration');
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:forgot-password');
        Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:reset-password');
        Route::get('/verify-email/{id}/{hash}', [AuthController::class, 'verifyEmailSigned'])
            ->name('verification.verify')
            ->middleware('throttle:6,1');

        // Protected Auth Endpoints (Requires valid Sanctum token & active account status)
        Route::middleware(['auth:sanctum', 'active'])->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::put('/me', [AuthController::class, 'updateProfile']);
            Route::post('/resend-code', [AuthController::class, 'resendCode'])->middleware('throttle:verification-resend');
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::post('/logout-all', [AuthController::class, 'logoutAll']);
        });
    });

    // Property Catalogs & Discovery
    Route::prefix('properties')->group(function () {
        Route::get('/areas', [PropertyController::class, 'areas']);
        Route::get('/amenities', [PropertyController::class, 'amenities']);

        Route::middleware([OptionalSanctumAuth::class])->group(function () {
            Route::get('/', [PropertyController::class, 'index']);
            Route::get('/{idOrSlug}', [PropertyController::class, 'show']);
            Route::get('/{idOrSlug}/reviews', [PropertyReviewController::class, 'index']);
        });
    });

    // Tenant Protected Endpoints
    Route::middleware(['auth:sanctum', 'role:tenant', 'active'])->group(function () {
        Route::prefix('tenant')->group(function () {
            Route::get('/dashboard/stats', [TenantDashboardController::class, 'stats']);
            Route::get('/preferences', [RentalPreferenceController::class, 'show']);
            Route::put('/preferences', [RentalPreferenceController::class, 'update']);
            Route::delete('/preferences', [RentalPreferenceController::class, 'destroy']);
            Route::get('/contact-requests', [TenantContactRequestController::class, 'index']);
            Route::get('/visits', [TenantVisitRequestController::class, 'index']);
            Route::patch('/visits/{id}/cancel', [TenantVisitRequestController::class, 'cancel']);

            // Favorites
            Route::get('/favorites', [TenantFavoriteController::class, 'index']);
            Route::post('/favorites', [TenantFavoriteController::class, 'store']);
            Route::delete('/favorites/{propertyId}', [TenantFavoriteController::class, 'destroy']);

            // Comparisons
            Route::get('/comparisons', [TenantComparisonController::class, 'index']);
            Route::post('/comparisons', [TenantComparisonController::class, 'store']);
            Route::delete('/comparisons', [TenantComparisonController::class, 'clear']);
            Route::delete('/comparisons/{propertyId}', [TenantComparisonController::class, 'destroy']);

            // Reviews
            Route::get('/reviews', [TenantReviewController::class, 'index']);
            Route::post('/reviews', [TenantReviewController::class, 'store'])->middleware('throttle:5,1');
        });
        Route::post('/properties/{id}/contact', [TenantContactRequestController::class, 'store'])
            ->middleware('throttle:5,1');
        Route::post('/properties/{id}/visits', [TenantVisitRequestController::class, 'store'])
            ->middleware('throttle:5,1');
        Route::post('/properties/{id}/reports', [TenantPropertyReportController::class, 'store'])
            ->middleware('throttle:5,1');
    });

    // Shared Authenticated Endpoints (Messaging & In-App Notifications)
    Route::middleware(['auth:sanctum', 'active'])->group(function () {
        // Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);

        // Direct Messaging
        Route::get('/conversations', [ConversationController::class, 'index']);
        Route::get('/conversations/{id}', [ConversationController::class, 'show']);
        Route::post('/conversations/{id}/messages', [ConversationController::class, 'sendMessage'])
            ->middleware('throttle:30,1');
        Route::post('/contact-requests/{id}/messages', [ConversationController::class, 'startFromContactRequest'])
            ->middleware('throttle:30,1');
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

        // Review Moderation
        Route::get('/reviews', [AdminReviewController::class, 'index']);
        Route::get('/reviews/{id}', [AdminReviewController::class, 'show']);
        Route::post('/reviews/{id}/approve', [AdminReviewController::class, 'approve']);
        Route::post('/reviews/{id}/reject', [AdminReviewController::class, 'reject']);

        // User Management
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::get('/users/{id}', [AdminUserController::class, 'show']);
        Route::patch('/users/{id}/status', [AdminUserController::class, 'updateStatus']);

        // Property Report Moderation
        Route::get('/reports', [AdminReportController::class, 'index']);
        Route::get('/reports/{id}', [AdminReportController::class, 'show']);
        Route::post('/reports/{id}/resolve', [AdminReportController::class, 'resolve']);
    });
});
