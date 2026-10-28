<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LandlordStatsResource extends JsonResource
{
    /**
     * Transform the resource into an array matching frontend LandlordStats.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'totalListings' => (int) ($this['totalListings'] ?? 0),
            'approvedListings' => (int) ($this['approvedListings'] ?? 0),
            'pendingListings' => (int) ($this['pendingListings'] ?? 0),
            'activeVisits' => (int) ($this['activeVisits'] ?? 0),
            'pendingContactRequests' => (int) ($this['pendingContactRequests'] ?? 0),
        ];
    }
}

