<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\RentalPreference
 */
class RentalPreferenceResource extends JsonResource
{
    /**
     * Transform the resource into an array matching frontend TenantPreferencesData.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $amenityNames = $this->relationLoaded('amenities')
            ? $this->amenities->pluck('name')->all()
            : [];

        $amenityIds = $this->relationLoaded('amenities')
            ? $this->amenities->pluck('id')->all()
            : [];

        return [
            'id' => (string) $this->id,
            'userId' => (string) $this->user_id,
            'preferredAreaId' => $this->preferred_area_id,
            'preferredArea' => $this->preferredArea?->name,
            'maxBudget' => $this->max_budget !== null ? (float) $this->max_budget : null,
            'preferredPropertyType' => $this->preferred_property_type,
            'minRooms' => $this->min_rooms !== null ? (int) $this->min_rooms : null,
            'minBathrooms' => $this->min_bathrooms !== null ? (int) $this->min_bathrooms : null,
            'preferredFurnished' => $this->preferred_furnished,
            'requiredAmenities' => $amenityNames,
            'amenityIds' => $amenityIds,
            'hasMeaningfulPreferences' => $this->hasMeaningfulPreferences(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
