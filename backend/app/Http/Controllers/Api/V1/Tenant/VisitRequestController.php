<?php

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVisitRequest;
use App\Http\Resources\VisitRequestResource;
use App\Models\Property;
use App\Models\VisitRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class VisitRequestController extends Controller
{
    /**
     * List all visit requests scheduled by the authenticated tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $visits = VisitRequest::with(['property.location', 'property.featuredImage', 'property.images', 'landlord'])
            ->where('tenant_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => VisitRequestResource::collection($visits),
        ]);
    }

    /**
     * Schedule a new property visit request.
     */
    public function store(StoreVisitRequest $request, string|int $id): JsonResponse
    {
        $property = Property::where('id', $id)->orWhere('slug', $id)->firstOrFail();

        $rawSlot = strtolower((string) $request->input('preferred_time_slot'));
        $canonicalSlot = 'morning';
        if (str_contains($rawSlot, 'afternoon')) {
            $canonicalSlot = 'afternoon';
        } elseif (str_contains($rawSlot, 'evening')) {
            $canonicalSlot = 'evening';
        }

        $visit = DB::transaction(function () use ($request, $property, $canonicalSlot) {
            return VisitRequest::create([
                'property_id' => $property->id,
                'tenant_id' => $request->user()->id,
                'landlord_id' => $property->landlord_id,
                'visit_date' => $request->input('visit_date'),
                'preferred_time_slot' => $canonicalSlot,
                'notes' => $request->input('notes'),
                'status' => 'pending',
            ]);
        });

        $visit->load(['property.location', 'property.featuredImage', 'property.images', 'landlord', 'tenant']);

        return response()->json([
            'success' => true,
            'data' => new VisitRequestResource($visit),
            'message' => 'Visit request scheduled successfully.',
        ], 201);
    }

    /**
     * Cancel a scheduled visit request (only before scheduled visit date).
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        /** @var VisitRequest $visit */
        $visit = VisitRequest::with(['property.location', 'property.featuredImage', 'property.images', 'landlord', 'tenant'])
            ->findOrFail($id);

        // IDOR Check
        if ((int) $visit->tenant_id !== (int) $request->user()->id) {
            return response()->json([
                'status' => 403,
                'message' => 'common.errors.forbidden',
            ], 403);
        }

        // Status check: cannot cancel terminal status
        if (in_array(strtolower($visit->status), ['completed', 'rejected', 'cancelled'], true)) {
            return response()->json([
                'status' => 422,
                'message' => 'Visit request is in a terminal status and cannot be cancelled.',
                'fieldErrors' => [
                    'status' => ['Visit request is in a terminal status and cannot be cancelled.'],
                ],
            ], 422);
        }

        // Date Cutoff Guard: Prohibit cancellation on or after the scheduled visit date
        $visitDate = Carbon::parse($visit->visit_date)->startOfDay();
        $today = Carbon::today();

        if ($visitDate->lessThanOrEqualTo($today)) {
            return response()->json([
                'status' => 422,
                'message' => 'Visits cannot be cancelled on or after the scheduled visit date.',
                'fieldErrors' => [
                    'cancellation' => ['Visits cannot be cancelled on or after the scheduled visit date.'],
                ],
            ], 422);
        }

        DB::transaction(function () use ($visit, $request) {
            $visit->update([
                'status' => 'cancelled',
                'cancellation_reason' => $request->input('cancellation_reason'),
            ]);
        });

        return response()->json([
            'success' => true,
            'data' => new VisitRequestResource($visit->fresh(['property.location', 'property.featuredImage', 'property.images', 'landlord', 'tenant'])),
            'message' => 'Visit request cancelled successfully.',
        ]);
    }
}

