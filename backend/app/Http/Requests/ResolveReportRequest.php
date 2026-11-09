<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ResolveReportRequest extends FormRequest
{
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
            'status' => ['required', 'string', Rule::in(['resolved', 'dismissed', 'Resolved', 'Dismissed'])],
            'admin_notes' => ['nullable', 'string', 'max:1000'],
            'resolution_note' => ['nullable', 'string', 'max:1000'],
            'action_on_property' => ['nullable', 'string', Rule::in(['none', 'reject', 'deactivate'])],
        ];
    }

    public function getResolutionNotes(): string
    {
        $notes = (string) ($this->input('admin_notes') ?? $this->input('resolution_note') ?? '');
        return trim($notes);
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $notes = $this->getResolutionNotes();
            if (strlen($notes) < 3) {
                $validator->errors()->add('admin_notes', 'Resolution notes are mandatory and must be at least 3 characters.');
            }
        });
    }
}

