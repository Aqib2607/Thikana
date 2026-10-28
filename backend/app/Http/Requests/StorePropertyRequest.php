<?php

namespace App\Http\Requests;

use App\Models\PropertyLocation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StorePropertyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->isActive();
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Resolve coordinates if omitted
        if (!$this->has('lat') || !$this->has('lng') || $this->input('lat') === null || $this->input('lng') === null) {
            $area = (string) $this->input('area');
            $resolved = PropertyLocation::resolveAreaCoordinates($area);
            if ($resolved) {
                $this->merge([
                    'lat' => $resolved['lat'],
                    'lng' => $resolved['lng'],
                ]);
            }
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
            'title' => 'required|string|min:5|max:255',
            'banglaTitle' => 'nullable|string|max:255',
            'propertyType' => 'required|string|in:Apartment / Flat,House,Room,Sublet,Hostel,Mess',
            'rentalType' => 'required|string|in:Monthly Rental,Sublet',
            'rent' => 'required|numeric|min:500',
            'advance' => 'nullable|numeric|min:0',
            'additionalCharges' => 'nullable|numeric|min:0',
            'billsIncluded' => 'nullable|array',
            'billsIncluded.*' => 'string|max:100',
            'availability' => 'nullable|string|in:Available,Reserved,Rented,Temporarily Unavailable',
            'availableFrom' => 'required|date',
            'division' => 'nullable|string|max:50',
            'district' => 'nullable|string|max:50',
            'city' => 'nullable|string|max:50',
            'area' => 'required|string|max:100',
            'exactAddress' => 'required|string|min:5',
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
            'size' => 'required|integer|min:50',
            'rooms' => 'required|integer|min:1',
            'bathrooms' => 'required|integer|min:1',
            'balconies' => 'nullable|integer|min:0',
            'floor' => 'required|string|max:50',
            'totalFloors' => 'nullable|integer|min:1',
            'furnishedStatus' => 'nullable|string|in:Furnished,Semi-Furnished,Unfurnished',
            'preferredTenant' => 'nullable|string|in:Any,Students Only,Male Students Only,Female Students Only,Family Only,Job Holders',
            'publicContactVisible' => 'nullable|boolean',
            'community' => 'nullable|array',
            'community.transport' => 'nullable|string',
            'community.waterlogging' => 'nullable|string',
            'community.internet' => 'nullable|string',
            'community.noise' => 'nullable|string',
            'community.safety' => 'nullable|string',
            'community.general' => 'nullable|string',
            'images' => 'required|array|min:1|max:5',
            'images.*' => 'required|string|url',
            'featuredImage' => 'nullable|string|url',
            'amenities' => 'nullable|array',
            'amenities.*' => 'string|max:100',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $lat = $this->input('lat');
            $lng = $this->input('lng');

            if ($lat !== null && $lng !== null) {
                if (!PropertyLocation::isValidRegionalCoordinate((float) $lat, (float) $lng)) {
                    $validator->errors()->add('lat', 'Coordinates must fall within the Khulna metropolitan region.');
                }
            }
        });
    }
}

