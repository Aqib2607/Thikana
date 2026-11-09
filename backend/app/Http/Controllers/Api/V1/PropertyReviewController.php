<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Property;
use App\Models\Review;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PropertyReviewController extends Controller
{
    /**
     * Get paginated approved reviews for a property available for discovery.
     */
    public function index(string $idOrSlug): AnonymousResourceCollection
    {
        $property = Property::availableForDiscovery()
            ->where(function ($query) use ($idOrSlug) {
                if (is_numeric($idOrSlug)) {
                    $query->where('id', (int) $idOrSlug)
                        ->orWhere('slug', $idOrSlug);
                } else {
                    $query->where('slug', $idOrSlug);
                }
            })
            ->firstOrFail();

        $reviews = Review::where('property_id', $property->id)
            ->where('status', 'approved')
            ->with('tenant')
            ->latest()
            ->paginate(10);

        return ReviewResource::collection($reviews);
    }
}

