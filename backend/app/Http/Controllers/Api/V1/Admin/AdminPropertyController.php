<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\RejectPropertyRequest;
use App\Http\Requests\UpdateVerificationsRequest;
use App\Http\Resources\PropertyResource;
use App\Models\AuditLog;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class AdminPropertyController extends Controller
{
    /**
     * List properties with optional status filter for administrative moderation.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $statusFilter = $request->query('statusFilter');

        $query = Property::with(['location', 'images', 'amenities', 'landlord', 'verifications'])
            ->orderByDesc('created_at');

        if (!empty($statusFilter) && strtoupper($statusFilter) !== 'ALL') {
            $query->where('approval_status', $statusFilter);
        }

        $perPage = (int) $request->query('per_page', 25);
        $perPage = max(1, min($perPage, 100));

        $properties = $query->paginate($perPage);

        return PropertyResource::collection($properties);
    }

    /**
     * Approve a pending property listing.
     */
    public function approve(Request $request, int $id): PropertyResource
    {
        $property = Property::with(['location', 'images', 'amenities', 'landlord', 'verifications'])
            ->findOrFail($id);

        $currentUser = $request->user();

        DB::transaction(function () use ($property, $currentUser) {
            $property->approval_status = 'Approved';
            $property->save();

            AuditLog::logAction(
                $currentUser,
                'PROPERTY_APPROVED',
                'property',
                (string) $property->id,
                "Listing '{$property->title}' approved after admin inspection."
            );
        });

        return new PropertyResource($property->fresh(['location', 'images', 'amenities', 'landlord', 'verifications']));
    }

    /**
     * Reject a property listing with a mandatory documented reason.
     */
    public function reject(RejectPropertyRequest $request, int $id): PropertyResource
    {
        $property = Property::with(['location', 'images', 'amenities', 'landlord', 'verifications'])
            ->findOrFail($id);

        $currentUser = $request->user();
        $reason = $request->input('reason');

        DB::transaction(function () use ($property, $currentUser, $reason) {
            $property->approval_status = 'Rejected';
            $property->save();

            AuditLog::logAction(
                $currentUser,
                'PROPERTY_REJECTED',
                'property',
                (string) $property->id,
                "Listing '{$property->title}' rejected. Reason: {$reason}"
            );
        });

        return new PropertyResource($property->fresh(['location', 'images', 'amenities', 'landlord', 'verifications']));
    }

    /**
     * Update admin-recorded verifications for a property.
     */
    public function updateVerifications(UpdateVerificationsRequest $request, int $id): PropertyResource
    {
        $property = Property::with(['location', 'images', 'amenities', 'landlord', 'verifications'])
            ->findOrFail($id);

        $currentUser = $request->user();
        $verifications = $request->input('verifications', []);

        DB::transaction(function () use ($property, $currentUser, $verifications) {
            // Delete existing verifications to cleanly sync the requested state
            $property->verifications()->delete();

            foreach ($verifications as $type) {
                $property->verifications()->create([
                    'verification_type' => $type,
                    'verified_by' => $currentUser->id,
                ]);
            }

            $typesStr = empty($verifications) ? 'None' : implode(', ', $verifications);
            AuditLog::logAction(
                $currentUser,
                'VERIFICATION_UPDATED',
                'property',
                (string) $property->id,
                "Updated simulated verifications: {$typesStr}."
            );
        });

        return new PropertyResource($property->fresh(['location', 'images', 'amenities', 'landlord', 'verifications']));
    }
}

