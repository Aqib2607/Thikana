<?php

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Resources\RentalPreferenceResource;
use App\Models\Conversation;
use App\Models\Favorite;
use App\Models\Message;
use App\Models\PropertyComparison;
use App\Models\RentalPreference;
use App\Models\User;
use App\Models\VisitRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantDashboardController extends Controller
{
    /**
     * Retrieve aggregated, database-backed dashboard metrics and saved preferences
     * strictly scoped to the authenticated tenant.
     */
    public function stats(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $favoritesCount = Favorite::where('user_id', $user->id)->count();

        $comparisonCount = PropertyComparison::where('user_id', $user->id)->count();

        $visitsCount = VisitRequest::where('tenant_id', $user->id)
            ->whereIn('status', ['pending', 'accepted', 'Pending', 'Accepted'])
            ->count();

        $conversationsCount = Conversation::where('tenant_id', $user->id)->count();

        $unreadMessagesCount = Message::whereHas('conversation', function ($query) use ($user) {
            $query->where('tenant_id', $user->id);
        })
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->count();

        $preference = RentalPreference::with(['preferredArea', 'amenities'])
            ->where('user_id', $user->id)
            ->first();

        $preferenceData = ($preference !== null && $preference->hasMeaningfulPreferences())
            ? (new RentalPreferenceResource($preference))->resolve()
            : null;

        $stats = [
            'favoritesCount' => $favoritesCount,
            'comparisonCount' => $comparisonCount,
            'visitsCount' => $visitsCount,
            'conversationsCount' => $conversationsCount,
            'unreadMessagesCount' => $unreadMessagesCount,
            'preferences' => $preferenceData,
        ];

        return response()->json([
            'data' => $stats,
            ...$stats,
        ]);
    }
}
