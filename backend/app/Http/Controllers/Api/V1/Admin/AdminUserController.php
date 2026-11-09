<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateUserStatusRequest;
use App\Models\AuditLog;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdminUserController extends Controller
{
    /**
     * List users with search, role filter, status filter, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with('role')->latest();

        // Search by name, email, phone
        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($role = trim((string) $request->query('role', ''))) {
            if (strtolower($role) !== 'all') {
                $query->whereHas('role', function ($q) use ($role) {
                    $q->where('slug', strtolower($role));
                });
            }
        }

        // Filter by status
        if ($status = trim((string) $request->query('status', ''))) {
            if (in_array(strtolower($status), ['active', 'suspended'], true)) {
                $query->where('status', strtolower($status));
            }
        }

        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min($perPage, 100));

        $paginator = $query->paginate($perPage);

        $transformedData = $paginator->getCollection()->map(fn (User $user) => $this->transformUser($user));

        return response()->json([
            'data' => $transformedData,
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'lastPage' => $paginator->lastPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * Show single user details with safe allowlisting.
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with('role')->findOrFail($id);

        $details = $this->transformUser($user);
        $details['listingsCount'] = $user->properties()->count();
        $details['reviewsCount'] = $user->reviews()->count();

        return response()->json([
            'data' => $details,
        ]);
    }

    /**
     * Toggle or update user account status (active <-> suspended).
     */
    public function updateStatus(UpdateUserStatusRequest $request, int $id): JsonResponse
    {
        /** @var User $currentAdmin */
        $currentAdmin = $request->user();
        $targetStatus = strtolower((string) $request->input('status'));

        // Prevent self-suspension
        if ((int) $currentAdmin->id === $id && $targetStatus === 'suspended') {
            return response()->json([
                'status' => 422,
                'message' => 'admin.errors.cannot_suspend_self',
                'fieldErrors' => [
                    'status' => ['Administrators cannot suspend their own account.'],
                ],
            ], 422);
        }

        $updatedUser = DB::transaction(function () use ($id, $targetStatus, $currentAdmin) {
            /** @var User $targetUser */
            $targetUser = User::with('role')->lockForUpdate()->findOrFail($id);

            // Redundancy check: avoid duplicate audit logs
            if ($targetUser->status === $targetStatus) {
                return $targetUser;
            }

            // Invariant: Cannot suspend the last active administrator
            if ($targetStatus === 'suspended' && $targetUser->hasRole('admin')) {
                $adminRoleId = Role::where('slug', 'admin')->value('id');
                $activeAdminCount = User::where('role_id', $adminRoleId)
                    ->where('status', 'active')
                    ->lockForUpdate()
                    ->count();

                if ($activeAdminCount <= 1) {
                    throw ValidationException::withMessages([
                        'status' => ['Cannot suspend the last active administrator on the platform.'],
                    ]);
                }
            }

            $previousStatus = $targetUser->status;
            $targetUser->status = $targetStatus;
            $targetUser->save();

            // Revoke all personal access tokens immediately upon suspension
            if ($targetStatus === 'suspended') {
                $targetUser->tokens()->delete();
            }

            AuditLog::logAction(
                $currentAdmin,
                'USER_STATUS_UPDATED',
                'user',
                (string) $targetUser->id,
                "User '{$targetUser->name}' (#{$targetUser->id}) status changed from {$previousStatus} to {$targetStatus}."
            );

            return $targetUser;
        });

        return response()->json([
            'data' => $this->transformUser($updatedUser->fresh('role')),
            'message' => "User status updated to {$targetStatus}.",
        ]);
    }

    /**
     * Carefully allowlisted response transformation to prevent sensitive leakage.
     *
     * @return array<string, mixed>
     */
    private function transformUser(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'name' => (string) $user->name,
            'email' => (string) $user->email,
            'phone' => (string) ($user->phone ?? ''),
            'role' => $user->role ? (string) $user->role->slug : 'tenant',
            'roleName' => $user->role ? (string) $user->role->name : 'Tenant',
            'verified' => $user->email_verified_at !== null,
            'status' => (string) $user->status,
            'avatarUrl' => $user->avatar_url,
            'createdAt' => $user->created_at?->toISOString(),
            'updatedAt' => $user->updated_at?->toISOString(),
        ];
    }
}
