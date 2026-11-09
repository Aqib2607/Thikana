<?php

namespace App\Http\Controllers\Api\V1\Landlord;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateContactRequestStatusRequest;
use App\Http\Resources\ContactRequestResource;
use App\Models\ContactRequest;
use App\Models\Notification;
use App\Models\Property;
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
            $prevStatus = $contactRequest->status;

            $contactRequest->update([
                'status' => $newStatus,
                'landlord_note' => $request->input('landlord_note'),
                'responded_at' => now(),
            ]);

            // Notify tenant only on valid transition to accepted (and avoid duplicates on retries)
            if ($newStatus === 'accepted' && $prevStatus !== 'accepted') {
                $property = $contactRequest->getRelationValue('property');
                $propertyTitle = ($property instanceof Property) ? (string) $property->title : 'listing';
                Notification::create([
                    'user_id' => $contactRequest->tenant_id,
                    'role' => 'tenant',
                    'type' => 'contact',
                    'title' => 'Contact Request Accepted',
                    'title_bn' => 'যোগাযোগের অনুরোধ গৃহীত হয়েছে',
                    'message' => "Landlord '{$request->user()->name}' accepted your contact request for '{$propertyTitle}'. You can now message them.",
                    'message_bn' => "বাড়িওয়ালা '{$request->user()->name}' আপনার লিস্টিং '{$propertyTitle}'-এর যোগাযোগের অনুরোধ গ্রহণ করেছেন। আপনি এখন তাদের মেসেজ পাঠাতে পারেন।",
                    'link' => '/tenant/messages',
                    'read' => false,
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'data' => new ContactRequestResource($contactRequest->fresh(['property', 'tenant', 'landlord'])),
            'message' => 'Contact request status updated successfully.',
        ]);
    }
}

