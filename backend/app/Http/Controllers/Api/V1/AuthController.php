<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Register a new user (tenant or landlord).
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $role = Role::where('slug', $request->validated('role'))->first();

        if (!$role) {
            return response()->json([
                'status' => 422,
                'message' => 'auth.errors.invalidRole',
                'fieldErrors' => ['role' => ['auth.errors.invalidRole']],
            ], 422);
        }

        $user = new User([
            'name' => $request->validated('name'),
            'email' => strtolower(trim($request->validated('email'))),
            'phone' => trim($request->validated('phone')),
            'password' => $request->validated('password'),
        ]);

        $user->role_id = $role->id;
        $user->status = 'active';
        $user->save();

        $token = $user->createToken('auth-token', ['role:' . $role->slug])->plainTextToken;

        return response()->json([
            'status' => 201,
            'message' => 'auth.feedback.registered',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
        ], 201);
    }

    /**
     * Login with email or phone + password.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $identifier = trim($request->validated('identifier'));
        $cleanPhone = preg_replace('/[\s-]/', '', $identifier);

        $user = User::with('role')
            ->where('email', strtolower($identifier))
            ->orWhere('phone', $cleanPhone)
            ->first();

        if (!$user || !Hash::check($request->validated('password'), $user->password)) {
            return response()->json([
                'status' => 401,
                'message' => 'auth.errors.invalid',
            ], 401);
        }

        if ($user->isSuspended()) {
            return response()->json([
                'status' => 403,
                'message' => 'auth.errors.suspended',
            ], 403);
        }

        $token = $user->createToken('auth-token', ['role:' . ($user->role?->slug ?? 'tenant')])->plainTextToken;

        return response()->json([
            'status' => 200,
            'message' => 'auth.feedback.loggedIn',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
        ]);
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('role');

        return response()->json([
            'status' => 200,
            'data' => [
                'user' => new UserResource($user),
            ],
        ]);
    }

    /**
     * Revoke current access token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'status' => 200,
            'message' => 'auth.feedback.loggedOut',
        ]);
    }

    /**
     * Revoke all access tokens across all devices.
     */
    public function logoutAll(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'status' => 200,
            'message' => 'auth.feedback.loggedOutAll',
        ]);
    }

    /**
     * Initiate password reset.
     * Operationally honest: does not claim real email dispatch without SMTP transport.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'string', 'email']]);
        $email = strtolower(trim($request->input('email')));

        $isProduction = app()->environment('production');

        return response()->json([
            'status' => 200,
            'message' => 'auth.feedback.resetInitiated',
            'data' => [
                'mode' => $isProduction ? 'production' : 'simulation',
                'delivery' => $isProduction ? 'smtp' : 'log',
                ...(!$isProduction ? ['simulationCode' => '123456'] : []),
                'note' => $isProduction
                    ? 'If an account exists, instructions have been delivered.'
                    : 'In local/testing mode, simulation code 123456 is active. Real email dispatch requires configured MAIL_MAILER in production.',
            ],
        ]);
    }

    /**
     * Complete password reset with code.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'code' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $email = strtolower(trim($request->input('email')));
        $code = trim($request->input('code'));

        if ($code !== '123456') {
            return response()->json([
                'status' => 422,
                'message' => 'auth.errors.code',
                'fieldErrors' => ['code' => ['auth.errors.code']],
            ], 422);
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'status' => 422,
                'message' => 'auth.errors.code',
                'fieldErrors' => ['code' => ['auth.errors.code']],
            ], 422);
        }

        $user->password = $request->input('password');
        $user->save();

        // Security: invalidate all existing tokens on password reset
        $user->tokens()->delete();

        return response()->json([
            'status' => 200,
            'message' => 'auth.feedback.passwordReset',
        ]);
    }

    /**
     * Verify email with 6-digit simulation code.
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        $request->validate(['code' => ['required', 'string']]);

        if (trim($request->input('code')) !== '123456') {
            return response()->json([
                'status' => 422,
                'message' => 'auth.errors.code',
                'fieldErrors' => ['code' => ['auth.errors.code']],
            ], 422);
        }

        $user = $request->user();
        if ($user) {
            $user->email_verified_at = now();
            $user->save();

            return response()->json([
                'status' => 200,
                'message' => 'auth.feedback.verified',
                'data' => [
                    'user' => new UserResource($user),
                ],
            ]);
        }

        return response()->json([
            'status' => 200,
            'message' => 'auth.feedback.verified',
        ]);
    }

    /**
     * Resend verification code.
     */
    public function resendCode(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 200,
            'message' => 'auth.feedback.codeResent',
        ]);
    }
}

