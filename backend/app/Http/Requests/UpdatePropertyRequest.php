<?php

namespace App\Http\Requests;

use App\Models\PropertyLocation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdatePropertyRequest extends FormRequest
{
    /**
     * Material fields that trigger an automatic approval status reset to 'Pending Approval'.
     */
    public const MATERIAL_FIELDS = [
        'title',
        'rent',
        'advance',
        'additionalCharges',
        'billsIncluded',
        'propertyType',
        'rentalType',
        'size',
        'rooms',
        'bathrooms',
        'balconies',
        'area',
        'exactAddress',
        'lat',
        'lng',
        'images',
    ];

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->isActive();
    }

    /**
     * Prepare data before validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('area') && (!$this->has('lat') || !$this->has('lng') || $this->input('lat') === null || $this->input('lng') === null)) {
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
            // Landlords cannot set administrative approval status
            'approvalStatus' => 'prohibited',
            'approval_status' => 'prohibited',

            'title' => 'sometimes|required|string|min:5|max:255',
            'banglaTitle' => 'nullable|string|max:255',
            'propertyType' => 'sometimes|required|string|in:Apartment / Flat,House,Room,Sublet,Hostel,Mess',
            'rentalType' => 'sometimes|required|string|in:Monthly Rental,Sublet',
            'rent' => 'sometimes|required|numeric|min:500',
            'advance' => 'nullable|numeric|min:0',
            'additionalCharges' => 'nullable|numeric|min:0',
            'billsIncluded' => 'nullable|array',
            'billsIncluded.*' => 'string|max:100',
            'availability' => 'nullable|string|in:Available,Reserved,Rented,Temporarily Unavailable',
            'availableFrom' => 'sometimes|required|date',
            'division' => 'nullable|string|max:50',
            'district' => 'nullable|string|max:50',
            'city' => 'nullable|string|max:50',
            'area' => 'sometimes|required|string|max:100',
            'exactAddress' => 'sometimes|required|string|min:5',
            'lat' => 'sometimes|required|numeric',
            'lng' => 'sometimes|required|numeric',
            'size' => 'sometimes|required|integer|min:50',
            'rooms' => 'sometimes|required|integer|min:1',
            'bathrooms' => 'sometimes|required|integer|min:1',
            'balconies' => 'nullable|integer|min:0',
            'floor' => 'sometimes|required|string|max:50',
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
            'images' => 'sometimes|required|array|min:1|max:5',
            'images.*' => 'required|string|url',
            'featuredImage' => 'nullable|string|url',
            'amenities' => 'nullable|array',
            'amenities.*' => 'string|max:100',
        ];
    }

    /**
     * Check if the request contains any material changes.
     */
    public function hasMaterialChanges(): bool
    {
        foreach (self::MATERIAL_FIELDS as $field) {
            if ($this->has($field)) {
                return true;
            }
        }
        return false;
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

