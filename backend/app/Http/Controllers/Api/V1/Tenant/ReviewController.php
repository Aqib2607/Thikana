<?php

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Property;
use App\Models\Review;
use App\Models\VisitRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ReviewController extends Controller
{
    /**
     * List authenticated tenant's submitted reviews.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $reviews = Review::where('tenant_id', $user->id)
            ->with(['property', 'tenant'])
            ->latest()
            ->paginate(10);

        return ReviewResource::collection($reviews);
    }

    /**
     * Submit a new review for an eligible property.
     */
    public function store(StoreReviewRequest $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $validated = $request->validated();
        $propertyId = (int) $validated['property_id'];

        $property = Property::availableForDiscovery()->findOrFail($propertyId);

        // Enforce one review per tenant per property
        $alreadyReviewed = Review::where('property_id', $property->id)
            ->where('tenant_id', $user->id)
            ->exists();

        if ($alreadyReviewed) {
            return response()->json([
                'message' => 'You have already submitted a review for this property.',
            ], 422);
        }

        // Derive visited_verified server-side from completed visit requests
        $hasCompletedVisit = VisitRequest::where('property_id', $property->id)
            ->where('tenant_id', $user->id)
            ->where('status', 'completed')
            ->exists();

        // Calculate overall rating server-side
        $subRatingsSum = (int) $validated['accuracy_rating']
            + (int) $validated['landlord_behavior_rating']
            + (int) $validated['location_rating']
            + (int) $validated['overall_experience_rating'];

        $overallRating = round($subRatingsSum / 4, 2);

        $review = Review::create([
            'property_id' => $property->id,
            'tenant_id' => $user->id,
            'overall_rating' => $overallRating,
            'accuracy_rating' => (int) $validated['accuracy_rating'],
            'landlord_behavior_rating' => (int) $validated['landlord_behavior_rating'],
            'location_rating' => (int) $validated['location_rating'],
            'overall_experience_rating' => (int) $validated['overall_experience_rating'],
            'comment' => (string) $validated['comment'],
            'visited_verified' => $hasCompletedVisit,
            'status' => 'pending',
            'admin_notes' => null,
            'moderated_by' => null,
            'moderated_at' => null,
        ]);

        $review->load('tenant');

        return (new ReviewResource($review))
            ->response()
            ->setStatusCode(201);
    }
}

