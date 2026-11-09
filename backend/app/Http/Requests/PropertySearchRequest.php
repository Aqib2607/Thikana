<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PropertySearchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare query inputs for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('amenities') && is_string($this->input('amenities'))) {
            $list = array_values(array_filter(explode(',', (string) $this->input('amenities'))));
            $this->merge(['amenities' => $list]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'search' => ['nullable', 'string', 'max:255'],
            'area' => ['nullable', 'string', 'max:100'],
            'propertyType' => ['nullable', 'string', Rule::in([
                'Apartment / Flat', 'House', 'Room', 'Sublet', 'Hostel', 'Mess',
            ])],
            'rentalType' => ['nullable', 'string', Rule::in([
                'Monthly Rental', 'Sublet',
            ])],
            'minRent' => ['nullable', 'numeric', 'min:0'],
            'maxRent' => ['nullable', 'numeric', 'min:0'],
            'rooms' => ['nullable', 'integer', 'min:1', 'max:20'],
            'bathrooms' => ['nullable', 'integer', 'min:1', 'max:20'],
            'furnishedStatus' => ['nullable', 'string', Rule::in([
                'Furnished', 'Semi-Furnished', 'Unfurnished',
            ])],
            'availability' => ['nullable', 'string', Rule::in([
                'Available', 'Reserved', 'Rented', 'Temporarily Unavailable',
            ])],
            'amenities' => ['nullable', 'array'],
            'amenities.*' => ['string', 'max:100'],
            'sortBy' => ['nullable', 'string', Rule::in([
                'newest', 'price_asc', 'price_desc', 'rating', 'match',
            ])],
            'page' => ['nullable', 'integer', 'min:1'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
            'verifiedOnly' => ['nullable', 'in:true,false,1,0'],
        ];

        if ($this->filled('minRent') && $this->filled('maxRent')) {
            $rules['maxRent'][] = 'gte:minRent';
        }

        return $rules;
    }
}

