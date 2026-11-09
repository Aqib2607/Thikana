<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\AuditLog;
use App\Models\Property;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class AdminReviewController extends Controller
{
    /**
     * List reviews for moderation (filterable by status: pending, approved, rejected).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $status = $request->query('status', 'pending');

        $query = Review::with(['property', 'tenant', 'moderator'])->latest();

        if (is_string($status) && in_array($status, ['pending', 'approved', 'rejected'], true)) {
            $query->where('status', $status);
        }

        $reviews = $query->paginate(15);

        return ReviewResource::collection($reviews);
    }

    /**
     * Show a review's moderation details.
     */
    public function show(int $id): ReviewResource
    {
        $review = Review::with(['property', 'tenant', 'moderator'])->findOrFail($id);

        return new ReviewResource($review);
    }

    /**
     * Approve a review and recalculate property rating aggregates.
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        /** @var \App\Models\User $admin */
        $admin = $request->user();

        $review = Review::with('property')->findOrFail($id);

        DB::transaction(function () use ($review, $admin, $request) {
            $adminNotes = $request->input('admin_notes');

            $review->update([
                'status' => 'approved',
                'admin_notes' => is_string($adminNotes) ? $adminNotes : $review->admin_notes,
                'moderated_by' => $admin->id,
                'moderated_at' => now(),
            ]);

            $this->recalculatePropertyRating($review->property_id);

            AuditLog::logAction(
                $admin,
                'REVIEW_APPROVED',
                'review',
                (string) $review->id,
                "Review #{$review->id} for property #{$review->property_id} approved."
            );
        });

        return (new ReviewResource($review->fresh(['property', 'tenant', 'moderator'])))
            ->response()
            ->setStatusCode(200);
    }

    /**
     * Reject a review and recalculate property rating aggregates.
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        /** @var \App\Models\User $admin */
        $admin = $request->user();

        $review = Review::with('property')->findOrFail($id);

        DB::transaction(function () use ($review, $admin, $request) {
            $adminNotes = $request->input('admin_notes');

            $review->update([
                'status' => 'rejected',
                'admin_notes' => is_string($adminNotes) ? $adminNotes : $review->admin_notes,
                'moderated_by' => $admin->id,
                'moderated_at' => now(),
            ]);

            $this->recalculatePropertyRating($review->property_id);

            AuditLog::logAction(
                $admin,
                'REVIEW_REJECTED',
                'review',
                (string) $review->id,
                "Review #{$review->id} for property #{$review->property_id} rejected. Reason: " . (is_string($adminNotes) ? $adminNotes : 'None')
            );
        });

        return (new ReviewResource($review->fresh(['property', 'tenant', 'moderator'])))
            ->response()
            ->setStatusCode(200);
    }

    /**
     * Helper to recalculate rating aggregates for a property within a transaction.
     */
    protected function recalculatePropertyRating(int $propertyId): void
    {
        $property = Property::lockForUpdate()->find($propertyId);
        if (!$property) {
            return;
        }

        $approvedReviews = Review::where('property_id', $propertyId)->where('status', 'approved');
        $count = $approvedReviews->count();
        $avg = $count > 0 ? (float) $approvedReviews->avg('overall_rating') : 0.00;

        $property->update([
            'rating' => round($avg, 2),
            'review_count' => $count,
        ]);
    }
}

