<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    /**
     * Transform the resource into an array matching frontend AuditLogItem.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'actorId' => (string) ($this->actor_id ?? ''),
            'actorName' => $this->actor_name,
            'action' => $this->action,
            'targetType' => $this->target_type,
            'targetId' => (string) $this->target_id,
            'details' => $this->details,
            'timestamp' => $this->created_at ? $this->created_at->toISOString() : now()->toISOString(),
        ];
    }
}

