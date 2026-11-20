<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'priority' => $this->priority,
            'status' => $this->status,
            'version' => $this->version,
            // Lets the UI show only the status buttons that are valid right now.
            'allowed_transitions' => $this->status->allowedTransitions(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
