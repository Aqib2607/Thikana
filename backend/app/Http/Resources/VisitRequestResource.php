<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VisitRequestResource extends JsonResource
{
    /**
     * Transform the resource into an array matching frontend VisitRequestItem.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $slotLabels = [
            'morning' => 'Morning (09:00 AM - 12:00 PM)',
            'afternoon' => 'Afternoon (12:00 PM - 04:00 PM)',
            'evening' => 'Evening (04:00 PM - 07:00 PM)',
        ];

        $rawSlot = strtolower((string) $this->preferred_time_slot);
        $canonicalSlot = 'morning';
        if (str_contains($rawSlot, 'morning')) {
            $canonicalSlot = 'morning';
        } elseif (str_contains($rawSlot, 'afternoon')) {
            $canonicalSlot = 'afternoon';
        } elseif (str_contains($rawSlot, 'evening')) {
            $canonicalSlot = 'evening';
        }

        $displaySlot = $slotLabels[$canonicalSlot] ?? ucfirst($canonicalSlot);

        $propertyImage = '';
        if ($this->relationLoaded('property') && $this->property) {
            $propertyImage = $this->property->featuredImage?->image_url
                ?? ($this->property->images?->first()?->image_url ?? '');
        }

        return [
            'id' => (string) $this->id,
            'propertyId' => (string) $this->property_id,
            'propertyTitle' => $this->property?->title ?? '',
            'propertyArea' => $this->property?->location?->area ?? $this->property?->area ?? 'Khulna',
            'propertyRent' => (float) ($this->property?->rent ?? 0),
            'propertyImage' => $propertyImage ?: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80',
            'landlordId' => (string) $this->landlord_id,
            'landlordName' => $this->landlord?->name ?? 'Landlord',
            'tenantId' => (string) $this->tenant_id,
            'tenantName' => $this->tenant?->name ?? 'Tenant',
            'visitDate' => $this->visit_date ? $this->visit_date->format('Y-m-d') : '',
            'visitTimeSlot' => $displaySlot,
            'preferredTimeSlot' => $canonicalSlot,
            'note' => $this->notes,
            'status' => ucfirst(strtolower($this->status)),
            'cancellationReason' => $this->cancellation_reason,
            'landlordNotes' => $this->landlord_notes,
            'createdAt' => $this->created_at?->toISOString() ?? now()->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString() ?? now()->toISOString(),
        ];
    }
}

