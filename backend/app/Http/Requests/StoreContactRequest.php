<?php

namespace App\Http\Requests;

use App\Models\ContactRequest;
use App\Models\Property;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

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
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $propertyId = $this->route('id') ?? $this->route('idOrSlug');
            $property = Property::where('id', $propertyId)
                ->orWhere('slug', $propertyId)
                ->first();

            if (! $property) {
                $validator->errors()->add('property', 'Property not found.');

                return;
            }

            if ($property->approval_status !== 'Approved') {
                $validator->errors()->add('property', 'Contact requests can only be sent for approved properties.');

                return;
            }

            if ($property->availability !== 'Available') {
                $validator->errors()->add('property', 'Contact requests can only be sent for currently available properties.');

                return;
            }

            if ((int) $property->landlord_id === (int) $this->user()->id) {
                $validator->errors()->add('property', 'Landlords cannot send contact requests for their own property.');

                return;
            }

            // Duplicate pending contact request prevention
            $hasPending = ContactRequest::where('property_id', $property->id)
                ->where('tenant_id', $this->user()->id)
                ->where('status', 'pending')
                ->exists();

            if ($hasPending) {
                $validator->errors()->add('property', 'You already have a pending contact request for this property.');
            }
        });
    }
}
