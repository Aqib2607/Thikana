<?php

namespace App\Http\Requests;

use App\Models\Area;
use Illuminate\Foundation\Http\FormRequest;

class RentalPreferenceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->hasRole('tenant');
    }

    /**
     * Prepare inputs for validation (handling camelCase or area name resolution).
     */
    protected function prepareForValidation(): void
    {
        $data = [];

        if ($this->has('preferredAreaId')) {
            $data['preferred_area_id'] = $this->input('preferredAreaId');
        } elseif ($this->has('preferred_area_id')) {
            $data['preferred_area_id'] = $this->input('preferred_area_id');
        } elseif ($this->has('preferredArea')) {
            $areaName = (string) $this->input('preferredArea');
            if ($areaName !== '' && $areaName !== 'All Areas') {
                $area = Area::where('name', $areaName)->first();
                $data['preferred_area_id'] = $area?->id;
            } else {
                $data['preferred_area_id'] = null;
            }
        }

        if ($this->has('maxBudget')) {
            $data['max_budget'] = $this->input('maxBudget');
        }
        if ($this->has('preferredPropertyType')) {
            $data['preferred_property_type'] = $this->input('preferredPropertyType');
        }
        if ($this->has('minRooms')) {
            $data['min_rooms'] = $this->input('minRooms');
        }
        if ($this->has('minBathrooms')) {
            $data['min_bathrooms'] = $this->input('minBathrooms');
        }
        if ($this->has('preferredFurnished')) {
            $data['preferred_furnished'] = $this->input('preferredFurnished');
        }
        if ($this->has('amenityIds')) {
            $data['amenity_ids'] = $this->input('amenityIds');
        }

        if ($data !== []) {
            $this->merge($data);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'preferred_area_id' => ['nullable', 'integer', 'exists:areas,id'],
            'max_budget' => ['nullable', 'numeric', 'min:1'],
            'preferred_property_type' => ['nullable', 'string', 'max:50'],
            'min_rooms' => ['nullable', 'integer', 'min:1', 'max:20'],
            'min_bathrooms' => ['nullable', 'integer', 'min:1', 'max:10'],
            'preferred_furnished' => ['nullable', 'string', 'max:50'],
            'amenity_ids' => ['nullable', 'array'],
            'amenity_ids.*' => ['integer', 'exists:amenities,id'],
            'required_amenities' => ['nullable', 'array'],
            'required_amenities.*' => ['string', 'max:100'],
        ];
    }
}

