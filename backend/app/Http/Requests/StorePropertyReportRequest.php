<?php

namespace App\Http\Requests;

use App\Models\Property;
use App\Models\PropertyReport;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StorePropertyReportRequest extends FormRequest
{
    public const SUPPORTED_REASONS = [
        'Fake listing',
        'Already rented',
        'Incorrect information',
        'Suspicious behavior',
        'Inappropriate content',
        'Other',
    ];

    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', Rule::in(self::SUPPORTED_REASONS)],
            'details' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $reason = (string) $this->input('reason');
            $details = trim((string) $this->input('details', ''));

            if ($reason === 'Other' && $details === '') {
                $validator->errors()->add('details', 'A description is mandatory when selecting Other as the reason.');
                return;
            }

            $propertyId = $this->route('id') ?? $this->route('idOrSlug');
            $property = Property::where('id', $propertyId)
                ->orWhere('slug', $propertyId)
                ->first();

            if (! $property) {
                $validator->errors()->add('property', 'Property not found.');
                return;
            }

            // Duplicate pending report guard
            $hasPending = PropertyReport::where('property_id', $property->id)
                ->where('reporter_id', $this->user()?->id)
                ->where('status', 'pending')
                ->exists();

            if ($hasPending) {
                $validator->errors()->add('report', 'You already have a pending report for this property.');
            }
        });
    }
}

