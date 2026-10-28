<?php

namespace App\Http\Controllers\Api\V1\Landlord;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePropertyRequest;
use App\Http\Requests\UpdateAvailabilityRequest;
use App\Http\Requests\UpdateContactVisibilityRequest;
use App\Http\Requests\UpdatePropertyRequest;
use App\Http\Resources\LandlordStatsResource;
use App\Http\Resources\PropertyResource;
use App\Models\Amenity;
use App\Models\Property;
use App\Models\PropertyLocation;
use App\Services\ImageManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class LandlordPropertyController extends Controller
{
    public function __construct(
        protected ImageManagementService $imageService
    ) {}

    /**
     * List all listings owned by the authenticated landlord.
     */
    public function index(Request $request): JsonResponse
    {
        $properties = Property::with(['landlord', 'location', 'images', 'featuredImage', 'amenities'])
            ->where('landlord_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => PropertyResource::collection($properties),
        ]);
    }

    /**
     * Create a new property listing (defaults to 'Pending Approval').
     */
    public function store(StorePropertyRequest $request): JsonResponse
    {
        $user = $request->user();

        $property = DB::transaction(function () use ($request, $user) {
            $slug = Property::generateSlug($request->input('title'));

            /** @var Property $property */
            $property = Property::create([
                'landlord_id' => $user->id,
                'title' => $request->input('title'),
                'bangla_title' => $request->input('banglaTitle'),
                'slug' => $slug,
                'property_type' => $request->input('propertyType'),
                'rental_type' => $request->input('rentalType'),
                'rent' => $request->input('rent'),
                'advance' => $request->input('advance', 0),
                'additional_charges' => $request->input('additionalCharges', 0),
                'bills_included' => $request->input('billsIncluded', []),
                'availability' => $request->input('availability', 'Available'),
                'available_from' => $request->input('availableFrom'),
                'approval_status' => 'Pending Approval', // Enforced default
                'size' => $request->input('size'),
                'rooms' => $request->input('rooms'),
                'bathrooms' => $request->input('bathrooms'),
                'balconies' => $request->input('balconies', 0),
                'floor' => $request->input('floor'),
                'total_floors' => $request->input('totalFloors'),
                'furnished_status' => $request->input('furnishedStatus', 'Unfurnished'),
                'preferred_tenant' => $request->input('preferredTenant', 'Any'),
                'public_contact_visible' => (bool) $request->input('publicContactVisible', false),
                'community_info' => $request->input('community'),
                'rating' => 0.00,
                'review_count' => 0,
            ]);

            // Create 1:1 Location
            $property->location()->create([
                'division' => $request->input('division', 'Khulna'),
                'district' => $request->input('district', 'Khulna'),
                'city' => $request->input('city', 'Khulna'),
                'area' => $request->input('area'),
                'exact_address' => $request->input('exactAddress'),
                'lat' => $request->input('lat'),
                'lng' => $request->input('lng'),
            ]);

            // Attach Amenities
            if ($amenities = $request->input('amenities')) {
                $amenityIds = Amenity::whereIn('name', $amenities)->pluck('id');
                $property->amenities()->sync($amenityIds);
            }

            // Ingest initial photos (1 to 5 images)
            $this->imageService->addImageUrls(
                $property,
                $user,
                $request->input('images'),
                $request->input('featuredImage')
            );

            return $property;
        });

        $property->load(['landlord', 'location', 'images', 'featuredImage', 'amenities']);

        return response()->json([
            'data' => new PropertyResource($property),
        ], 201);
    }

    /**
     * Show single landlord listing details.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $property = Property::with(['landlord', 'location', 'images', 'featuredImage', 'amenities'])
            ->where('id', $id)
            ->firstOrFail();

        Gate::authorize('update', $property);

        return response()->json([
            'data' => new PropertyResource($property),
        ]);
    }

    /**
     * Update listing with material-change re-approval enforcement.
     */
    public function update(UpdatePropertyRequest $request, int $id): JsonResponse
    {
        $property = Property::with(['landlord', 'location', 'images', 'featuredImage', 'amenities'])
            ->where('id', $id)
            ->firstOrFail();

        Gate::authorize('update', $property);

        $property = DB::transaction(function () use ($request, $property) {
            $currentApproval = $property->approval_status;

            // Determine target approval status based on Option B material change policy
            if ($currentApproval === 'Approved' && $request->hasMaterialChanges()) {
                $targetApproval = 'Pending Approval';
            } elseif ($currentApproval === 'Rejected') {
                $targetApproval = 'Pending Approval'; // Resubmission
            } else {
                $targetApproval = $currentApproval;
            }

            $updateData = [];
            $fieldMap = [
                'title' => 'title',
                'banglaTitle' => 'bangla_title',
                'propertyType' => 'property_type',
                'rentalType' => 'rental_type',
                'rent' => 'rent',
                'advance' => 'advance',
                'additionalCharges' => 'additional_charges',
                'billsIncluded' => 'bills_included',
                'availability' => 'availability',
                'availableFrom' => 'available_from',
                'size' => 'size',
                'rooms' => 'rooms',
                'bathrooms' => 'bathrooms',
                'balconies' => 'balconies',
                'floor' => 'floor',
                'totalFloors' => 'total_floors',
                'furnishedStatus' => 'furnished_status',
                'preferredTenant' => 'preferred_tenant',
                'publicContactVisible' => 'public_contact_visible',
                'community' => 'community_info',
            ];

            foreach ($fieldMap as $requestKey => $column) {
                if ($request->has($requestKey)) {
                    $updateData[$column] = $request->input($requestKey);
                }
            }

            $updateData['approval_status'] = $targetApproval;
            $property->update($updateData);

            // Update location if present
            $locData = [];
            foreach (['division', 'district', 'city', 'area', 'exactAddress' => 'exact_address', 'lat', 'lng'] as $reqK => $colK) {
                $field = is_string($reqK) ? $reqK : $colK;
                $targetCol = is_string($reqK) ? $colK : $reqK;
                if ($request->has($field)) {
                    $locData[$targetCol] = $request->input($field);
                }
            }
            if (!empty($locData)) {
                $property->location()->updateOrCreate(['property_id' => $property->id], $locData);
            }

            // Sync amenities if present
            if ($request->has('amenities')) {
                $amenityNames = (array) $request->input('amenities', []);
                $amenityIds = Amenity::whereIn('name', $amenityNames)->pluck('id');
                $property->amenities()->sync($amenityIds);
            }

            return $property;
        });

        $property->load(['landlord', 'location', 'images', 'featuredImage', 'amenities']);

        return response()->json([
            'data' => new PropertyResource($property),
        ]);
    }

    /**
     * Update listing availability independently.
     */
    public function updateAvailability(UpdateAvailabilityRequest $request, int $id): JsonResponse
    {
        $property = Property::where('id', $id)->firstOrFail();
        Gate::authorize('update', $property);

        $property->update([
            'availability' => $request->input('availability'),
        ]);

        $property->load(['landlord', 'location', 'images', 'featuredImage', 'amenities']);

        return response()->json([
            'data' => new PropertyResource($property),
        ]);
    }

    /**
     * Toggle public contact visibility.
     */
    public function updateContactVisibility(UpdateContactVisibilityRequest $request, int $id): JsonResponse
    {
        $property = Property::where('id', $id)->firstOrFail();
        Gate::authorize('update', $property);

        $property->update([
            'public_contact_visible' => (bool) $request->input('publicContactVisible'),
        ]);

        $property->load(['landlord', 'location', 'images', 'featuredImage', 'amenities']);

        return response()->json([
            'data' => new PropertyResource($property),
        ]);
    }

    /**
     * Soft delete a property listing.
     */
    public function destroy(Request $request, int $id): Response
    {
        $property = Property::where('id', $id)->firstOrFail();
        Gate::authorize('delete', $property);

        $property->delete();

        return response()->noContent();
    }

    /**
     * Landlord dashboard statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $total = Property::where('landlord_id', $userId)->count();
        $approved = Property::where('landlord_id', $userId)->where('approval_status', 'Approved')->count();
        $pending = Property::where('landlord_id', $userId)->where('approval_status', 'Pending Approval')->count();

        return response()->json([
            'data' => new LandlordStatsResource([
                'totalListings' => $total,
                'approvedListings' => $approved,
                'pendingListings' => $pending,
                'activeVisits' => 0,
                'pendingContactRequests' => 0,
            ]),
        ]);
    }
}

