<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20', 'unique:users,phone'],
            'password' => ['required', 'string', 'min:8'],
            // Hard role escalation defense: public registration strictly permits only tenant or landlord
            'role' => ['required', 'string', 'in:tenant,landlord'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'auth.errors.emailTaken',
            'phone.unique' => 'auth.errors.phoneTaken',
            'role.in' => 'auth.errors.invalidRole',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'status' => 422,
            'message' => 'auth.errors.invalid',
            'fieldErrors' => $validator->errors()->messages(),
        ], 422));
    }
}

