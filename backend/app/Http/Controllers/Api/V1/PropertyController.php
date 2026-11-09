<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PropertySearchRequest;
use App\Http\Resources\PropertyListResource;
use App\Http\Resources\PropertyResource;
use App\Models\Amenity;
use App\Models\Area;
use App\Models\Property;
use App\Models\PropertyLocation;
use App\Services\Matching\PropertyMatchingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class PropertyController extends Controller
{
    public function __construct(
        protected PropertyMatchingService $matchingService
    ) {}
    /**
     * Authenticated listing search with filtering, sorting, and pagination.
     */
    public function index(PropertySearchRequest $request): PropertyListResource
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
            $amenityList = array_values(array_filter($amenityList));
            if ($amenityList !== []) {
                $query->whereHas('amenities', fn ($q) => $q->whereIn('name', $amenityList));
            }
        }

        // Verified-only filter
        if ($request->boolean('verifiedOnly')) {
            $query->has('verifications');
        }

        /** @var \App\Models\User|null $currentUser */
        $currentUser = $request->user() ?? auth('sanctum')->user();
        $tenantPreference = null;
        if ($currentUser !== null && $currentUser->hasRole('tenant')) {
            $tenantPreference = $currentUser->rentalPreference()
                ->with(['preferredArea', 'amenities'])
                ->first();
        }

        $hasPreferences = $tenantPreference !== null && $tenantPreference->hasMeaningfulPreferences();

        // Sorting
        $sortBy = (string) $request->input('sortBy', 'newest');
        $limit = max(1, min(50, (int) $request->input('limit', 10)));
        $page = max(1, (int) $request->input('page', 1));

        if ($sortBy === 'match' && $hasPreferences) {
            $allMatching = $query->get();
            $allMatching->each(function (Property $property) use ($tenantPreference) {
                $property->setAttribute('match_breakdown', $this->matchingService->calculate($tenantPreference, $property));
            });

            $sorted = $allMatching->sort(function (Property $a, Property $b) {
                /** @var array{overallPercentage?: int}|null $matchA */
                $matchA = $a->getAttribute('match_breakdown');
                /** @var array{overallPercentage?: int}|null $matchB */
                $matchB = $b->getAttribute('match_breakdown');
                $scoreA = $matchA['overallPercentage'] ?? 0;
                $scoreB = $matchB['overallPercentage'] ?? 0;
                if ($scoreA === $scoreB) {
                    $timeA = $a->created_at ? $a->created_at->timestamp : 0;
                    $timeB = $b->created_at ? $b->created_at->timestamp : 0;
                    if ($timeA === $timeB) {
                        return $b->id <=> $a->id;
                    }
                    return $timeB <=> $timeA;
                }
                return $scoreB <=> $scoreA;
            })->values();

            $slice = $sorted->slice(($page - 1) * $limit, $limit)->values();
            $paginator = new LengthAwarePaginator(
                $slice,
                $sorted->count(),
                $limit,
                $page,
                ['path' => $request->url(), 'query' => $request->query()]
            );
        } else {
            match ($sortBy) {
                'price_asc' => $query->orderBy('rent', 'asc')->orderBy('id', 'desc'),
                'price_desc' => $query->orderBy('rent', 'desc')->orderBy('id', 'desc'),
                'rating' => $query->orderBy('rating', 'desc')->orderBy('id', 'desc'),
                default => $query->orderBy('created_at', 'desc')->orderBy('id', 'desc'),
            };

            $paginator = $query->paginate($limit);

            if ($hasPreferences) {
                $paginator->getCollection()->each(function (Property $property) use ($tenantPreference) {
                    $property->setAttribute('match_breakdown', $this->matchingService->calculate($tenantPreference, $property));
                });
            }
        }

        $areas = Area::query()
            ->orderBy('name')
            ->pluck('name')
            ->values()
            ->all();

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
            /** @var \App\Models\User|null $user */
            $user = $request->user() ?? auth('sanctum')->user();
            if ($user === null || (!$user->hasRole('admin') && (int) $user->id !== (int) $property->landlord_id)) {
                abort(404, 'common.errors.notFound');
            }
        }

        /** @var \App\Models\User|null $user */
        $user = $request->user() ?? auth('sanctum')->user();
        if ($user !== null && $user->hasRole('tenant')) {
            $preference = $user->rentalPreference()->with(['preferredArea', 'amenities'])->first();
            if ($preference !== null && $preference->hasMeaningfulPreferences()) {
                $property->setAttribute('match_breakdown', $this->matchingService->calculate($preference, $property));
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
            'data' => Area::query()
                ->orderBy('name')
                ->pluck('name')
                ->values()
                ->all(),
        ]);
    }

    /**
     * Master amenities list.
     */
    public function amenities(): JsonResponse
    {
        return response()->json([
            'data' => Amenity::query()
                ->orderBy('name')
                ->get(['name', 'bangla_name', 'icon']),
        ]);
    }
}
