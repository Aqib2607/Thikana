<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class PropertyListResource extends ResourceCollection
{
    /**
     * Transform the resource collection into an array matching frontend PropertyListResponse.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'data' => PropertyResource::collection($this->collection),
            'total' => $this->resource->total(),
            'page' => $this->resource->currentPage(),
            'limit' => $this->resource->perPage(),
            'totalPages' => $this->resource->lastPage(),
            'areas' => $this->additional['areas'] ?? [],
        ];
    }
}

