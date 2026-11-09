<?php

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Resources\PropertyResource;
use App\Models\Property;
use App\Models\PropertyComparison;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ComparisonController extends Controller
{
    /**
     * List authenticated tenant's comparison properties (max 3).
     */
    public function index(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $comparisons = PropertyComparison::where('user_id', $user->id)
            ->orderBy('display_order')
            ->with([
                'property.location',
                'property.images',
                'property.amenities',
                'property.landlord',
                'property.verifications',
            ])
            ->get();

        $data = $comparisons->filter(function ($comp) {
            return $comp->property !== null
                && $comp->property->isApproved()
                && $comp->property->availability !== 'Temporarily Unavailable';
        })->values()->map(function ($comp) {
            return [
                'id' => (string) $comp->id,
                'propertyId' => (string) $comp->property_id,
                'displayOrder' => (int) $comp->display_order,
                'property' => new PropertyResource($comp->property),
                'createdAt' => $comp->created_at?->toISOString(),
            ];
        });

        return response()->json([
            'data' => $data,
        ]);
    }

    /**
     * Add a property to comparisons with strict max-3 rule and idempotency.
     */
    public function store(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $validated = $request->validate([
            'property_id' => ['required', 'integer', 'exists:properties,id'],
        ]);

        $property = Property::availableForDiscovery()->findOrFail((int) $validated['property_id']);

        $result = DB::transaction(function () use ($user, $property) {
            // Lock parent user record to serialize concurrent additions (FINDING-P4-01)
            User::where('id', $user->id)->lockForUpdate()->first();

            // Check if already in comparison (idempotent)
            $existing = PropertyComparison::where('user_id', $user->id)
                ->where('property_id', $property->id)
                ->first();

            if ($existing) {
                return ['record' => $existing, 'created' => false];
            }

            $count = PropertyComparison::where('user_id', $user->id)->count();

            if ($count >= 3) {
                abort(422, 'You can compare up to 3 properties at a time.');
            }

            $created = PropertyComparison::create([
                'user_id' => $user->id,
                'property_id' => $property->id,
                'display_order' => $count,
            ]);

            return ['record' => $created, 'created' => true];
        });

        /** @var \App\Models\PropertyComparison $record */
        $record = $result['record'];
        $status = $result['created'] ? 201 : 200;

        return response()->json([
            'message' => $result['created'] ? 'Property added to comparison.' : 'Property already in comparison.',
            'data' => [
                'id' => (string) $record->id,
                'propertyId' => (string) $record->property_id,
                'displayOrder' => (int) $record->display_order,
                'createdAt' => $record->created_at?->toISOString(),
            ],
        ], $status);
    }

    /**
     * Remove a property from comparisons.
     */
    public function destroy(Request $request, int $propertyId): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        PropertyComparison::where('user_id', $user->id)
            ->where('property_id', $propertyId)
            ->delete();

        return response()->json([
            'message' => 'Property removed from comparison.',
        ]);
    }

    /**
     * Clear all comparisons for authenticated tenant.
     */
    public function clear(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        PropertyComparison::where('user_id', $user->id)->delete();

        return response()->json([
            'message' => 'All properties removed from comparison.',
        ]);
    }
}
