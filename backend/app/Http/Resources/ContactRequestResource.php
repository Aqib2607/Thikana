<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContactRequestResource extends JsonResource
{
    /**
     * Transform the resource into an array matching frontend ContactRequestItem.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $currentUser = $request->user();
        $isRecipientTenant = $currentUser && (int) $currentUser->id === (int) $this->tenant_id;
        $isAccepted = strtolower($this->status) === 'accepted';

        // Option A Contact Disclosure:
        // Landlord contact details are only disclosed to the tenant whose request is accepted
        $landlordContact = null;
        if ($isRecipientTenant && $isAccepted && $this->relationLoaded('landlord') && $this->landlord) {
            $landlordContact = [
                'phone' => $this->landlord->phone,
                'email' => $this->landlord->email,
            ];
        }

        return [
            'id' => (string) $this->id,
            'propertyId' => (string) $this->property_id,
            'propertyTitle' => $this->property?->title ?? '',
            'landlordId' => (string) $this->landlord_id,
            'landlordName' => $this->landlord?->name ?? 'Landlord',
            'tenantId' => (string) $this->tenant_id,
            'tenantName' => $this->tenant?->name ?? 'Tenant',
            'tenantPhone' => $this->phone ?? $this->tenant?->phone ?? '',
            'message' => $this->message,
            'status' => ucfirst(strtolower($this->status)),
            'landlordContact' => $landlordContact,
            'landlordNote' => $this->landlord_note,
            'respondedAt' => $this->responded_at?->toISOString(),
            'createdAt' => $this->created_at?->toISOString() ?? now()->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString() ?? now()->toISOString(),
        ];
    }
}

