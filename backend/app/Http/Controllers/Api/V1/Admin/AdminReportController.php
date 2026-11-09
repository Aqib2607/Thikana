<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ResolveReportRequest;
use App\Http\Resources\PropertyReportResource;
use App\Models\AuditLog;
use App\Models\Property;
use App\Models\PropertyReport;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdminReportController extends Controller
{
    /**
     * List reports with optional status filtering.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $status = $request->query('status') ?? $request->query('statusFilter');

        $query = PropertyReport::with(['property', 'reporter', 'resolver'])->latest();

        if (is_string($status) && $status !== '' && strtolower($status) !== 'all') {
            $normalizedStatus = match (strtolower($status)) {
                'pending', 'pending review' => 'pending',
                'resolved' => 'resolved',
                'dismissed' => 'dismissed',
                default => null,
            };

            if ($normalizedStatus) {
                $query->where('status', $normalizedStatus);
            }
        }

        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min($perPage, 100));

        $reports = $query->paginate($perPage);

        return PropertyReportResource::collection($reports);
    }

    /**
     * Show report details.
     */
    public function show(int $id): PropertyReportResource
    {
        $report = PropertyReport::with(['property', 'reporter', 'resolver'])->findOrFail($id);

        return new PropertyReportResource($report);
    }

    /**
     * Resolve or dismiss a report.
     */
    public function resolve(ResolveReportRequest $request, int $id): JsonResponse
    {
        /** @var User $admin */
        $admin = $request->user();

        $targetStatus = strtolower((string) $request->input('status'));
        if (! in_array($targetStatus, ['resolved', 'dismissed'], true)) {
            $targetStatus = 'resolved';
        }

        $resolutionNotes = $request->getResolutionNotes();
        $actionOnProperty = (string) $request->input('action_on_property', 'none');

        $report = DB::transaction(function () use ($id, $admin, $targetStatus, $resolutionNotes, $actionOnProperty) {
            /** @var PropertyReport $report */
            $report = PropertyReport::with('property')->lockForUpdate()->findOrFail($id);

            // Prevent already-resolved reports from being overwritten
            if ($report->status !== 'pending') {
                throw ValidationException::withMessages([
                    'status' => ['This report has already been resolved or dismissed and cannot be modified.'],
                ]);
            }

            $report->update([
                'status' => $targetStatus,
                'admin_notes' => $resolutionNotes,
                'resolved_by' => $admin->id,
                'resolved_at' => now(),
            ]);

            $actionName = $targetStatus === 'resolved' ? 'REPORT_RESOLVED' : 'REPORT_DISMISSED';
            AuditLog::logAction(
                $admin,
                $actionName,
                'report',
                (string) $report->id,
                "Report #{$report->id} on listing #{$report->property_id} {$targetStatus}. Notes: {$resolutionNotes}"
            );

            // If action on property was requested
            if ($report->property) {
                if ($actionOnProperty === 'reject') {
                    $report->property->update(['approval_status' => 'Rejected']);
                    AuditLog::logAction(
                        $admin,
                        'PROPERTY_REJECTED',
                        'property',
                        (string) $report->property->id,
                        "Listing rejected following resolution of report #{$report->id}."
                    );
                } elseif ($actionOnProperty === 'deactivate') {
                    $report->property->update(['availability' => 'Temporarily Unavailable']);
                    AuditLog::logAction(
                        $admin,
                        'PROPERTY_DEACTIVATED',
                        'property',
                        (string) $report->property->id,
                        "Listing deactivated following resolution of report #{$report->id}."
                    );
                }
            }

            return $report;
        });

        return (new PropertyReportResource($report->fresh(['property', 'reporter', 'resolver'])))
            ->response()
            ->setStatusCode(200);
    }
}

