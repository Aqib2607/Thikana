<?php

namespace App\Http\Requests;

use App\Models\Property;
use App\Models\VisitRequest;
use Illuminate\Foundation\Http\FormRequest;

class StoreVisitRequest extends FormRequest
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
            'visit_date' => ['required', 'date', 'after:today'],
            'preferred_time_slot' => ['required', 'string'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Validate and normalize time slot
            $rawSlot = strtolower((string) $this->input('preferred_time_slot'));
            $canonicalSlot = null;
            if (str_contains($rawSlot, 'morning')) {
                $canonicalSlot = 'morning';
            } elseif (str_contains($rawSlot, 'afternoon')) {
                $canonicalSlot = 'afternoon';
            } elseif (str_contains($rawSlot, 'evening')) {
                $canonicalSlot = 'evening';
            }

            if (!$canonicalSlot) {
                $validator->errors()->add('preferred_time_slot', 'Select a valid time slot (morning, afternoon, or evening).');
                return;
            }

            // Resolve property
            $propertyId = $this->route('id') ?? $this->route('idOrSlug');
            $property = Property::where('id', $propertyId)
                ->orWhere('slug', $propertyId)
                ->first();

            if (!$property) {
                $validator->errors()->add('property', 'Property not found.');
                return;
            }

            if ($property->approval_status !== 'Approved') {
                $validator->errors()->add('property', 'Property is not eligible for visit bookings.');
                return;
            }

            // Self-booking guard
            if ((int) $property->landlord_id === (int) $this->user()->id) {
                $validator->errors()->add('property', 'Landlords cannot schedule visits for their own property.');
                return;
            }

            // Duplicate active booking guard
            $hasActive = VisitRequest::where('property_id', $property->id)
                ->where('tenant_id', $this->user()->id)
                ->whereIn('status', ['pending', 'accepted'])
                ->exists();

            if ($hasActive) {
                $validator->errors()->add('property', 'You already have an active visit request for this property.');
            }
        });
    }
}

