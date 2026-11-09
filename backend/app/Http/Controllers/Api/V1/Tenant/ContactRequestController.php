<?php

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContactRequest;
use App\Http\Resources\ContactRequestResource;
use App\Models\ContactRequest;
use App\Models\Notification;
use App\Models\Property;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

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
            // Lock parent user record to serialize concurrent submissions (FINDING-P5-01)
            User::where('id', $request->user()->id)->lockForUpdate()->first();

            $hasPending = ContactRequest::where('property_id', $property->id)
                ->where('tenant_id', $request->user()->id)
                ->where('status', 'pending')
                ->lockForUpdate()
                ->exists();

            if ($hasPending) {
                throw ValidationException::withMessages([
                    'property' => ['You already have a pending contact request for this property.'],
                ]);
            }

            $contact = ContactRequest::create([
                'property_id' => $property->id,
                'tenant_id' => $request->user()->id,
                'landlord_id' => $property->landlord_id,
                'message' => $request->input('message'),
                'phone' => $request->input('phone'),
                'status' => 'pending',
            ]);

            // Notify landlord about new inbound contact request
            Notification::create([
                'user_id' => $property->landlord_id,
                'role' => 'landlord',
                'type' => 'contact',
                'title' => 'New Contact Request',
                'title_bn' => 'নতুন যোগাযোগের অনুরোধ',
                'message' => "Tenant '{$request->user()->name}' sent a contact request for '{$property->title}'.",
                'message_bn' => "ভাড়াটিয়া '{$request->user()->name}' আপনার লিস্টিং '{$property->title}'-এর জন্য যোগাযোগের অনুরোধ পাঠিয়েছেন।",
                'link' => '/landlord/contact-requests',
                'read' => false,
            ]);

            return $contact;
        });

        $contactRequest->load(['property', 'landlord', 'tenant']);

        return response()->json([
            'success' => true,
            'data' => new ContactRequestResource($contactRequest),
            'message' => 'Contact request sent successfully.',
        ], 201);
    }
}

