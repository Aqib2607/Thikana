<?php

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Resources\PropertyResource;
use App\Models\Favorite;
use App\Models\Property;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FavoriteController extends Controller
{
    /**
     * List authenticated tenant's favorites with discovery-eligible properties.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $properties = Property::availableForDiscovery()
            ->whereHas('favorites', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->with(['location', 'images', 'amenities', 'landlord', 'verifications'])
            ->latest('properties.created_at')
            ->paginate(15);

        return PropertyResource::collection($properties);
    }

    /**
     * Add a property to authenticated tenant's favorites idempotently.
     */
    public function store(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $validated = $request->validate([
            'property_id' => ['required', 'integer', 'exists:properties,id'],
        ]);

        $property = Property::availableForDiscovery()->findOrFail((int) $validated['property_id']);

        $favorite = Favorite::firstOrCreate([
            'user_id' => $user->id,
            'property_id' => $property->id,
        ]);

        return response()->json([
            'message' => 'Property added to favorites.',
            'data' => [
                'id' => (string) $favorite->id,
                'property_id' => (string) $favorite->property_id,
                'created_at' => $favorite->created_at?->toISOString(),
            ],
        ], 201);
    }

    /**
     * Remove a property from authenticated tenant's favorites idempotently.
     */
    public function destroy(Request $request, int $propertyId): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        Favorite::where('user_id', $user->id)
            ->where('property_id', $propertyId)
            ->delete();

        return response()->json([
            'message' => 'Property removed from favorites.',
        ]);
    }
}

