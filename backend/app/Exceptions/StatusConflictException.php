<?php

namespace App\Exceptions;

use App\Enums\RequestStatus;
use App\Models\ServiceRequest;
use Illuminate\Http\JsonResponse;
use RuntimeException;

// Thrown when a status update can't be applied. Always returns HTTP 409.
class StatusConflictException extends RuntimeException
{
    private function __construct(
        string $message,
        public readonly string $reason,
        public readonly ServiceRequest $serviceRequest,
    ) {
        parent::__construct($message);
    }

    public static function staleVersion(ServiceRequest $serviceRequest): self
    {
        return new self(
            'This request was changed by someone else. Reload it and try again.',
            'stale_version',
            $serviceRequest,
        );
    }

    public static function invalidTransition(ServiceRequest $serviceRequest, RequestStatus $to): self
    {
        return new self(
            "Cannot change status from {$serviceRequest->status->value} to {$to->value}.",
            'invalid_transition',
            $serviceRequest,
        );
    }

    public function render(): JsonResponse
    {
        // Include the latest status and version so the client can refresh and retry.
        return response()->json([
            'message' => $this->getMessage(),
            'reason' => $this->reason,
            'current_status' => $this->serviceRequest->status,
            'current_version' => $this->serviceRequest->version,
        ], 409);
    }
}
