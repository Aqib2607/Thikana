<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminDashboardStatsResource extends JsonResource
{
    /**
     * Transform the resource into an array matching frontend AdminStats.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'pendingProperties' => (int) ($this->resource['pendingProperties'] ?? 0),
            'approvedProperties' => (int) ($this->resource['approvedProperties'] ?? 0),
            'totalProperties' => (int) ($this->resource['totalProperties'] ?? 0),
            'totalUsers' => (int) ($this->resource['totalUsers'] ?? 0),
            'tenantUsers' => (int) ($this->resource['tenantUsers'] ?? 0),
            'landlordUsers' => (int) ($this->resource['landlordUsers'] ?? 0),
            'pendingReports' => (int) ($this->resource['pendingReports'] ?? 0),
            'totalReviews' => (int) ($this->resource['totalReviews'] ?? 0),
            'auditLogsCount' => (int) ($this->resource['auditLogsCount'] ?? 0),
        ];
    }
}

