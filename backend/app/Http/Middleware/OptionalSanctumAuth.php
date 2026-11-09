<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class OptionalSanctumAuth
{
    /**
     * Handle an incoming request with optional Sanctum authentication.
     *
     * Authenticates the user via Sanctum (bearer token or stateful session)
     * using Sanctum's built-in guard validation. If valid, the user is bound
     * to the request and default auth guard. If suspended, a 403 is returned
     * without side effects. If unauthenticated or token is invalid/expired,
     * the request safely proceeds as a guest.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $guard = Auth::guard('sanctum');
        if (method_exists($guard, 'setRequest')) {
            $guard->setRequest($request);
        }

        /** @var \App\Models\User|null $user */
        $user = $guard->user();

        if ($user !== null) {
            if ($user->isSuspended()) {
                return response()->json([
                    'status' => 403,
                    'message' => 'auth.errors.suspended',
                ], 403);
            }

            Auth::shouldUse('sanctum');
            $request->setUserResolver(fn ($guard = null) => Auth::guard($guard ?? 'sanctum')->user());
        }

        return $next($request);
    }
}
