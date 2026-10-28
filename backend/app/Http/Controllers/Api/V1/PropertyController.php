<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PropertyListResource;
use App\Http\Resources\PropertyResource;
use App\Models\Amenity;
use App\Models\Property;
use App\Models\PropertyLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    /**
     * Public listing search with filtering, sorting, and pagination.
     */
    public function index(Request $request): PropertyListResource
    {
        $query = Property::with(['landlord', 'location', 'images', 'featuredImage', 'amenities'])
            ->availableForDiscovery();

        // Search text filter
        if ($search = trim((string) $request->input('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('bangla_title', 'like', "%{$search}%")
                    ->orWhereHas('location', function ($loc) use ($search) {
                        $loc->where('area', 'like', "%{$search}%")
                            ->orWhere('exact_address', 'like', "%{$search}%");
                    });
            });
        }

        // Area filter
        if ($area = $request->input('area')) {
            if ($area !== 'All Areas') {
                $query->whereHas('location', fn ($loc) => $loc->where('area', $area));
            }
        }

        // Property type & rental type
        if ($propertyType = $request->input('propertyType')) {
            $query->where('property_type', $propertyType);
        }
        if ($rentalType = $request->input('rentalType')) {
            $query->where('rental_type', $rentalType);
        }

        // Price range
        if ($minRent = $request->input('minRent')) {
            $query->where('rent', '>=', (float) $minRent);
        }
        if ($maxRent = $request->input('maxRent')) {
            $query->where('rent', '<=', (float) $maxRent);
        }

        // Rooms & Bathrooms
        if ($rooms = $request->input('rooms')) {
            $query->where('rooms', '>=', (int) $rooms);
        }
        if ($bathrooms = $request->input('bathrooms')) {
            $query->where('bathrooms', '>=', (int) $bathrooms);
        }

        // Furnished status & availability
        if ($furnishedStatus = $request->input('furnishedStatus')) {
            $query->where('furnished_status', $furnishedStatus);
        }
        if ($availability = $request->input('availability')) {
            $query->where('availability', $availability);
        }

        // Amenities filter
        if ($amenities = $request->input('amenities')) {
            $amenityList = is_array($amenities) ? $amenities : explode(',', (string) $amenities);
            if (!empty($amenityList)) {
                $query->whereHas('amenities', fn ($q) => $q->whereIn('name', $amenityList));
            }
        }

        // Sorting
        $sortBy = (string) $request->input('sortBy', 'newest');
        match ($sortBy) {
            'price_asc' => $query->orderBy('rent', 'asc'),
            'price_desc' => $query->orderBy('rent', 'desc'),
            'rating' => $query->orderBy('rating', 'desc'),
            default => $query->orderBy('created_at', 'desc'),
        };

        $limit = max(1, min(50, (int) $request->input('limit', 10)));
        $paginator = $query->paginate($limit);

        $areas = array_keys(PropertyLocation::CANONICAL_AREAS);

        return (new PropertyListResource($paginator))->additional(['areas' => $areas]);
    }

    /**
     * Public listing detail resolved by ID or stable slug.
     */
    public function show(Request $request, string $idOrSlug): JsonResponse
    {
        $property = Property::with(['landlord', 'location', 'images', 'featuredImage', 'amenities'])
            ->where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->firstOrFail();

        // Security check: unapproved listings are hidden from public
        if (!$property->isApproved()) {
            $user = $request->user() ?? auth('sanctum')->user();
            if ($user === null || (!$user->hasRole('admin') && (int) $user->id !== (int) $property->landlord_id)) {
                abort(404, 'common.errors.notFound');
            }
        }

        return response()->json([
            'data' => new PropertyResource($property),
        ]);
    }

    /**
     * Recognized canonical area list.
     */
    public function areas(): JsonResponse
    {
        return response()->json([
            'data' => array_keys(PropertyLocation::CANONICAL_AREAS),
        ]);
    }

    /**
     * Master amenities list.
     */
    public function amenities(): JsonResponse
    {
        return response()->json([
            'data' => Amenity::all(['name', 'bangla_name', 'icon']),
        ]);
    }
}
