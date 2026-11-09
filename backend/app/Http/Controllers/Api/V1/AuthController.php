<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class AuthController extends Controller
{
    /**
     * Register a new user (tenant or landlord).
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $role = Role::where('slug', $request->validated('role'))->first();

        if (! $role) {
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

        $user->sendEmailVerificationNotification();

        $token = $user->createToken('auth-token', ['role:'.$role->slug])->plainTextToken;

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

        if (! $user || ! Hash::check($request->validated('password'), $user->password)) {
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

        $token = $user->createToken('auth-token', ['role:'.($user->role?->slug ?? 'tenant')])->plainTextToken;

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
     * Update authenticated user profile.
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $user->name = $request->validated('name');

        if ($request->has('phone')) {
            $user->phone = $request->validated('phone');
        }

        $user->save();

        return response()->json([
            'status' => 200,
            'message' => 'profile.feedback.updated',
            'data' => [
                'user' => new UserResource($user->load('role')),
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
     * Uses Laravel Password Broker to generate cryptographically secure reset token
     * and dispatch notification via configured mailer. Generic response prevents account enumeration.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'string', 'email']]);
        $email = strtolower(trim($request->input('email')));

        Password::broker()->sendResetLink(['email' => $email]);

        return response()->json([
            'status' => 200,
            'message' => 'auth.feedback.resetInitiated',
            'data' => [
                'note' => 'If an account exists, password reset instructions have been dispatched.',
            ],
        ]);
    }

    /**
     * Complete password reset with secure token.
     * Validates token through Laravel Password Broker, securely updates password,
     * deletes the reset token record, and revokes all active Sanctum tokens.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'code' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $credentials = [
            'email' => strtolower(trim($request->input('email'))),
            'token' => trim($request->input('code')),
            'password' => $request->input('password'),
        ];

        $status = Password::broker()->reset(
            $credentials,
            function (User $user, string $password) {
                $user->password = $password;
                $user->setRememberToken(Str::random(60));
                $user->save();

                // Security: invalidate all existing tokens on password reset
                $user->tokens()->delete();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'status' => 200,
                'message' => 'auth.feedback.passwordReset',
            ]);
        }

        return response()->json([
            'status' => 422,
            'message' => 'auth.errors.code',
            'fieldErrors' => [
                'code' => [__($status)],
            ],
        ], 422);
    }

    /**
     * Verify email with cryptographically signed URL.
     * Validates HMAC-SHA256 signature, expiration timestamp, and email hash.
     */
    public function verifyEmailSigned(Request $request, int $id, string $hash): SymfonyResponse
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', config('app.url', 'http://localhost:5173')), '/');

        if (! $request->hasValidSignature()) {
            if ($request->wantsJson()) {
                return response()->json([
                    'status' => 403,
                    'message' => 'auth.errors.invalidSignature',
                ], 403);
            }

            return redirect()->away("{$frontendUrl}/verify-email?status=invalid");
        }

        $user = User::find($id);

        if (! $user || ! hash_equals(sha1($user->getEmailForVerification()), (string) $hash)) {
            if ($request->wantsJson()) {
                return response()->json([
                    'status' => 403,
                    'message' => 'auth.errors.invalidSignature',
                ], 403);
            }

            return redirect()->away("{$frontendUrl}/verify-email?status=invalid");
        }

        if ($user->hasVerifiedEmail()) {
            if ($request->wantsJson()) {
                return response()->json([
                    'status' => 200,
                    'message' => 'auth.feedback.alreadyVerified',
                    'data' => [
                        'user' => new UserResource($user),
                    ],
                ]);
            }

            return redirect()->away("{$frontendUrl}/verify-email?status=already_verified");
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        if ($request->wantsJson()) {
            return response()->json([
                'status' => 200,
                'message' => 'auth.feedback.verified',
                'data' => [
                    'user' => new UserResource($user),
                ],
            ]);
        }

        return redirect()->away("{$frontendUrl}/verify-email?status=success");
    }

    /**
     * Resend verification notification for authenticated user.
     */
    public function resendCode(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'status' => 401,
                'message' => 'auth.errors.unauthenticated',
            ], 401);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'status' => 200,
                'message' => 'auth.feedback.alreadyVerified',
            ]);
        }

        $user->sendEmailVerificationNotification();

        return response()->json([
            'status' => 200,
            'message' => 'auth.feedback.codeResent',
        ]);
    }
}
