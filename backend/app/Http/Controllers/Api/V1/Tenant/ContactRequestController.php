<?php

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContactRequest;
use App\Http\Resources\ContactRequestResource;
use App\Models\ContactRequest;
use App\Models\Property;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ContactRequestController extends Controller
{
    /**
     * List contact requests submitted by the authenticated tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $requests = ContactRequest::with(['property', 'landlord', 'tenant'])
            ->where('tenant_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => ContactRequestResource::collection($requests),
        ]);
    }

    /**
     * Submit a contact request for a property listing.
     */
    public function store(StoreContactRequest $request, string|int $id): JsonResponse
    {
        $property = Property::where('id', $id)->orWhere('slug', $id)->firstOrFail();

        $contactRequest = DB::transaction(function () use ($request, $property) {
            return ContactRequest::create([
                'property_id' => $property->id,
                'tenant_id' => $request->user()->id,
                'landlord_id' => $property->landlord_id,
                'message' => $request->input('message'),
                'phone' => $request->input('phone'),
                'status' => 'pending',
            ]);
        });

        $contactRequest->load(['property', 'landlord', 'tenant']);

        return response()->json([
            'success' => true,
            'data' => new ContactRequestResource($contactRequest),
            'message' => 'Contact request sent successfully.',
        ], 201);
    }
}

