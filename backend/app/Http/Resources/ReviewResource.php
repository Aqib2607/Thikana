<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Review
 */
class ReviewResource extends JsonResource
{
    /**
     * Transform the resource into an array matching frontend PropertyReviewItem.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var \App\Models\User|null $currentUser */
        $currentUser = $request->user();
        $isAdmin = $currentUser !== null && $currentUser->hasRole('admin');

        return [
            'id' => (string) $this->id,
            'propertyId' => (string) $this->property_id,
            'tenantId' => (string) $this->tenant_id,
            'tenantName' => $this->tenant !== null ? $this->tenant->name : 'Anonymous Tenant',
            'visitedVerified' => (bool) $this->visited_verified,
            'overallRating' => (float) $this->overall_rating,
            'accuracyRating' => (int) $this->accuracy_rating,
            'landlordBehaviorRating' => (int) $this->landlord_behavior_rating,
            'locationRating' => (int) $this->location_rating,
            'overallExperienceRating' => (int) $this->overall_experience_rating,
            'comment' => $this->comment,
            'status' => $this->status,
            'createdAt' => $this->created_at?->toISOString() ?? now()->toISOString(),
            'adminNotes' => $this->when($isAdmin, $this->admin_notes),
            'moderatedBy' => $this->when($isAdmin, $this->moderated_by !== null ? (string) $this->moderated_by : null),
            'moderatedAt' => $this->when($isAdmin, $this->moderated_at?->toISOString()),
        ];
    }
}
