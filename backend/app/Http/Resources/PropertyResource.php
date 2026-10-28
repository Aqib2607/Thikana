<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyResource extends JsonResource
{
    /**
     * Transform the resource into an array matching frontend PropertyItem.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $currentUser = $request->user() ?? auth('sanctum')->user();
        $canViewPrivateContact = (bool) $this->public_contact_visible
            || ($currentUser !== null && ($currentUser->hasRole('admin') || (int) $currentUser->id === (int) $this->landlord_id));

        $imagesList = $this->relationLoaded('images')
            ? $this->images->pluck('image_url')->all()
            : [];

        $featured = $this->relationLoaded('featuredImage') && $this->featuredImage
            ? $this->featuredImage->image_url
            : ($imagesList[0] ?? '');

        $amenitiesList = $this->relationLoaded('amenities')
            ? $this->amenities->pluck('name')->all()
            : [];

        $defaultCommunity = [
            'transport' => '',
            'waterlogging' => '',
            'internet' => '',
            'noise' => '',
            'safety' => '',
            'general' => '',
        ];

        return [
            'id' => (string) $this->id,
            'title' => $this->title,
            'banglaTitle' => $this->bangla_title,
            'slug' => $this->slug,
            'propertyType' => $this->property_type,
            'rentalType' => $this->rental_type,
            'rent' => (float) $this->rent,
            'advance' => (float) $this->advance,
            'additionalCharges' => (float) $this->additional_charges,
            'billsIncluded' => $this->bills_included ?? [],
            'availability' => $this->availability,
            'availableFrom' => $this->available_from ? $this->available_from->format('Y-m-d') : '',
            'approvalStatus' => $this->approval_status,

            // Location Hierarchy
            'division' => $this->location?->division ?? 'Khulna',
            'district' => $this->location?->district ?? 'Khulna',
            'city' => $this->location?->city ?? 'Khulna',
            'area' => $this->location?->area ?? '',
            'exactAddress' => $this->location?->exact_address ?? '',
            'lat' => (float) ($this->location?->lat ?? 22.8456),
            'lng' => (float) ($this->location?->lng ?? 89.5403),

            // Specifications
            'size' => (int) $this->size,
            'rooms' => (int) $this->rooms,
            'bathrooms' => (int) $this->bathrooms,
            'balconies' => (int) $this->balconies,
            'floor' => $this->floor,
            'totalFloors' => $this->total_floors ? (int) $this->total_floors : null,
            'furnishedStatus' => $this->furnished_status,
            'preferredTenant' => $this->preferred_tenant,

            // Media & Amenities
            'images' => $imagesList,
            'featuredImage' => $featured,
            'amenities' => $amenitiesList,

            // Admin Recorded Verifications
            'verifications' => $this->relationLoaded('verifications')
                ? $this->verifications->pluck('verification_type')->values()->all()
                : $this->verifications()->pluck('verification_type')->values()->all(),

            // Community Information
            'community' => is_array($this->community_info)
                ? array_merge($defaultCommunity, $this->community_info)
                : $defaultCommunity,

            // Landlord Profile with PII Redaction
            'landlord' => [
                'id' => (string) $this->landlord?->id,
                'name' => $this->landlord?->name ?? 'Landlord',
                'avatar' => $this->landlord?->avatar ?? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
                'memberSince' => $this->landlord?->created_at ? $this->landlord->created_at->format('F Y') : 'October 2026',
                'publicContactVisible' => (bool) $this->public_contact_visible,
                'phone' => $canViewPrivateContact ? $this->landlord?->phone : null,
                'email' => $canViewPrivateContact ? $this->landlord?->email : null,
                'verified' => (bool) ($this->landlord?->email_verified_at !== null || $this->landlord?->phone_verified_at !== null),
            ],

            'rating' => (float) $this->rating,
            'reviewCount' => (int) $this->review_count,
            'createdAt' => $this->created_at?->toISOString() ?? now()->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString() ?? now()->toISOString(),
        ];
    }
}

