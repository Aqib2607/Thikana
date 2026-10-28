<?php

namespace App\Http\Controllers\Api\V1\Landlord;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateVisitStatusRequest;
use App\Http\Resources\VisitRequestResource;
use App\Models\VisitRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LandlordVisitRequestController extends Controller
{
    /**
     * List inbound visit requests for listings owned by the authenticated landlord.
     */
    public function index(Request $request): JsonResponse
    {
        $query = VisitRequest::with(['property.location', 'property.featuredImage', 'property.images', 'tenant'])
            ->where('landlord_id', $request->user()->id)
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $status = strtolower($request->input('status'));
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        if ($request->filled('property_id')) {
            $query->where('property_id', $request->input('property_id'));
        }

        $visits = $query->get();

        return response()->json([
            'data' => VisitRequestResource::collection($visits),
        ]);
    }

    /**
     * Update visit request status following strict state machine rules.
     */
    public function updateStatus(UpdateVisitStatusRequest $request, int $id): JsonResponse
    {
        /** @var VisitRequest $visit */
        $visit = VisitRequest::with(['property.location', 'property.featuredImage', 'property.images', 'tenant', 'landlord'])
            ->findOrFail($id);

        // IDOR Check
        if ((int) $visit->landlord_id !== (int) $request->user()->id) {
            return response()->json([
                'status' => 403,
                'message' => 'common.errors.forbidden',
            ], 403);
        }

        $currentStatus = strtolower($visit->status);
        $newStatus = strtolower($request->input('status'));

        // Check terminal state
        if (in_array($currentStatus, ['completed', 'rejected', 'cancelled'], true)) {
            return response()->json([
                'status' => 422,
                'message' => 'Visit request is in a terminal status and cannot be modified.',
                'fieldErrors' => [
                    'status' => ['Visit request is in a terminal status and cannot be modified.'],
                ],
            ], 422);
        }

        // State Machine validation
        $allowedTransitions = [
            'pending' => ['accepted', 'rejected'],
            'accepted' => ['completed'],
        ];

        if (!isset($allowedTransitions[$currentStatus]) || !in_array($newStatus, $allowedTransitions[$currentStatus], true)) {
            return response()->json([
                'status' => 422,
                'message' => "Invalid status transition from '{$visit->status}' to '{$request->input('status')}'.",
                'fieldErrors' => [
                    'status' => ["Invalid status transition from '{$visit->status}' to '{$request->input('status')}'."],
                ],
            ], 422);
        }

        DB::transaction(function () use ($visit, $newStatus, $request) {
            $visit->update([
                'status' => $newStatus,
                'landlord_notes' => $request->input('landlord_notes'),
            ]);
        });

        return response()->json([
            'success' => true,
            'data' => new VisitRequestResource($visit->fresh(['property.location', 'property.featuredImage', 'property.images', 'tenant', 'landlord'])),
            'message' => 'Visit status updated successfully.',
        ]);
    }
}

