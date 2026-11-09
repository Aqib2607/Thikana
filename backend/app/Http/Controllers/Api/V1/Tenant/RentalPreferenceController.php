<?php

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\RentalPreferenceRequest;
use App\Http\Resources\RentalPreferenceResource;
use App\Models\Amenity;
use App\Models\RentalPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RentalPreferenceController extends Controller
{
    /**
     * Retrieve the authenticated tenant's rental preferences.
     */
    public function show(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $preference = RentalPreference::with(['preferredArea', 'amenities'])
            ->where('user_id', $user->id)
            ->first();

        if ($preference === null) {
            return response()->json([
                'data' => null,
            ]);
        }

        return response()->json([
            'data' => new RentalPreferenceResource($preference),
        ]);
    }

    /**
     * Create or update the authenticated tenant's rental preferences.
     */
    public function update(RentalPreferenceRequest $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $validated = $request->validated();

        $attributes = [
            'preferred_area_id' => $validated['preferred_area_id'] ?? null,
            'max_budget' => isset($validated['max_budget']) ? (float) $validated['max_budget'] : null,
            'preferred_property_type' => $validated['preferred_property_type'] ?? null,
            'min_rooms' => isset($validated['min_rooms']) ? (int) $validated['min_rooms'] : null,
            'min_bathrooms' => isset($validated['min_bathrooms']) ? (int) $validated['min_bathrooms'] : null,
            'preferred_furnished' => $validated['preferred_furnished'] ?? null,
        ];

        $preference = RentalPreference::updateOrCreate(
            ['user_id' => $user->id],
            $attributes
        );

        // Sync amenities if provided (supporting IDs or names)
        if (isset($validated['amenity_ids'])) {
            $preference->amenities()->sync($validated['amenity_ids']);
        } elseif ($request->has('requiredAmenities') || isset($validated['required_amenities'])) {
            $names = (array) ($request->input('requiredAmenities') ?? $validated['required_amenities'] ?? []);
            $ids = Amenity::whereIn('name', $names)->pluck('id')->all();
            $preference->amenities()->sync($ids);
        }

        $preference->load(['preferredArea', 'amenities']);

        return response()->json([
            'data' => new RentalPreferenceResource($preference),
            'message' => 'Preferences updated successfully',
        ]);
    }

    /**
     * Clear the authenticated tenant's rental preferences.
     */
    public function destroy(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        RentalPreference::where('user_id', $user->id)->delete();

        return response()->json([
            'message' => 'Preferences cleared successfully',
        ]);
    }
}

