<?php

namespace App\Http\Controllers\Api\V1\Landlord;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateContactRequestStatusRequest;
use App\Http\Resources\ContactRequestResource;
use App\Models\ContactRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LandlordContactRequestController extends Controller
{
    /**
     * List inbound contact requests for listings owned by the authenticated landlord.
     */
    public function index(Request $request): JsonResponse
    {
        $requests = ContactRequest::with(['property', 'tenant', 'landlord'])
            ->where('landlord_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => ContactRequestResource::collection($requests),
        ]);
    }

    /**
     * Update the status of a contact request (Accept / Reject).
     */
    public function updateStatus(UpdateContactRequestStatusRequest $request, int $id): JsonResponse
    {
        /** @var ContactRequest $contactRequest */
        $contactRequest = ContactRequest::with(['property', 'tenant', 'landlord'])->findOrFail($id);

        // IDOR Defense: Only the landlord who owns the listing may update the status
        if ((int) $contactRequest->landlord_id !== (int) $request->user()->id) {
            return response()->json([
                'status' => 403,
                'message' => 'common.errors.forbidden',
            ], 403);
        }

        $newStatus = strtolower($request->input('status'));

        DB::transaction(function () use ($contactRequest, $newStatus, $request) {
            $contactRequest->update([
                'status' => $newStatus,
                'landlord_note' => $request->input('landlord_note'),
                'responded_at' => now(),
            ]);
        });

        return response()->json([
            'success' => true,
            'data' => new ContactRequestResource($contactRequest->fresh(['property', 'tenant', 'landlord'])),
            'message' => 'Contact request status updated successfully.',
        ]);
    }
}

