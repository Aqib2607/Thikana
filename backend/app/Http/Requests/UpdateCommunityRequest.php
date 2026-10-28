<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCommunityRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'transport' => ['nullable', 'string', 'max:2000'],
            'waterlogging' => ['nullable', 'string', 'max:2000'],
            'internet' => ['nullable', 'string', 'max:2000'],
            'noise' => ['nullable', 'string', 'max:2000'],
            'safety' => ['nullable', 'string', 'max:2000'],
            'general' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

