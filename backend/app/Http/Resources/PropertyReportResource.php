<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read \App\Models\PropertyReport $resource
 */
class PropertyReportResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $statusMap = [
            'pending' => 'Pending Review',
            'resolved' => 'Resolved',
            'dismissed' => 'Dismissed',
        ];

        return [
            'id' => (string) $this->resource->id,
            'propertyId' => (string) $this->resource->property_id,
            'propertyTitle' => $this->resource->property ? (string) $this->resource->property->title : 'Listing #' . $this->resource->property_id,
            'propertySlug' => $this->resource->property ? (string) $this->resource->property->slug : '',
            'reporterId' => (string) $this->resource->reporter_id,
            'reporterName' => $this->resource->reporter ? (string) $this->resource->reporter->name : 'Anonymous',
            'reason' => (string) $this->resource->reason,
            'details' => (string) ($this->resource->details ?? ''),
            'status' => $statusMap[strtolower($this->resource->status)] ?? $this->resource->status,
            'rawStatus' => strtolower($this->resource->status),
            'adminNotes' => $this->resource->admin_notes,
            'resolvedBy' => $this->resource->resolver?->name,
            'resolvedById' => $this->resource->resolved_by ? (string) $this->resource->resolved_by : null,
            'resolvedAt' => $this->resource->resolved_at?->toISOString(),
            'createdAt' => $this->resource->created_at?->toISOString(),
            'updatedAt' => $this->resource->updated_at?->toISOString(),
        ];
    }
}
