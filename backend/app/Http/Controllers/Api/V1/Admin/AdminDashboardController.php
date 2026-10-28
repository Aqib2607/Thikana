<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminDashboardStatsResource;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use App\Models\Property;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminDashboardController extends Controller
{
    /**
     * Compute real-time dashboard metrics and counts for administrators.
     */
    public function stats(): AdminDashboardStatsResource
    {
        $pendingProperties = Property::where('approval_status', 'Pending Approval')->count();
        $approvedProperties = Property::where('approval_status', 'Approved')->count();
        $totalProperties = Property::count();

        $totalUsers = User::count();
        $tenantUsers = User::whereHas('role', function ($q) {
            $q->where('slug', 'tenant');
        })->count();
        $landlordUsers = User::whereHas('role', function ($q) {
            $q->where('slug', 'landlord');
        })->count();

        $auditLogsCount = AuditLog::count();

        $stats = [
            'pendingProperties' => $pendingProperties,
            'approvedProperties' => $approvedProperties,
            'totalProperties' => $totalProperties,
            'totalUsers' => $totalUsers,
            'tenantUsers' => $tenantUsers,
            'landlordUsers' => $landlordUsers,
            'pendingReports' => 0,
            'totalReviews' => 0,
            'auditLogsCount' => $auditLogsCount,
        ];

        return new AdminDashboardStatsResource($stats);
    }

    /**
     * Retrieve paginated append-only administrative audit logs.
     */
    public function auditLogs(Request $request): AnonymousResourceCollection
    {
        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min($perPage, 100));

        $logs = AuditLog::orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($perPage);

        return AuditLogResource::collection($logs);
    }
}
