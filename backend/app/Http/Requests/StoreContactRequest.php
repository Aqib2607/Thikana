<?php

namespace App\Http\Requests;

use App\Models\Property;
use Illuminate\Foundation\Http\FormRequest;

class StoreContactRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'message' => ['required', 'string', 'min:5', 'max:1000'],
            'phone' => ['nullable', 'string', 'max:30'],
        ];
    }

    /**
     * Custom after-validation checks for resource existence and self-contact prevention.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $propertyId = $this->route('id') ?? $this->route('idOrSlug');
            $property = Property::where('id', $propertyId)
                ->orWhere('slug', $propertyId)
                ->first();

            if (!$property) {
                $validator->errors()->add('property', 'Property not found.');
                return;
            }

            if ((int) $property->landlord_id === (int) $this->user()->id) {
                $validator->errors()->add('property', 'Landlords cannot send contact requests for their own property.');
            }
        });
    }
}

