<?php

namespace App\Services;

use App\Enums\RequestStatus;
use App\Exceptions\StatusConflictException;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class StatusTransitionService
{
    // Changes the status using optimistic locking (version check).
    /** @throws StatusConflictException */
    public function transition(
        ServiceRequest $serviceRequest,
        RequestStatus $toStatus,
        int $expectedVersion,
        User $actor,
        ?string $remark = null,
    ): ServiceRequest {
        if ($serviceRequest->version !== $expectedVersion) {
            throw StatusConflictException::staleVersion($serviceRequest);
        }

        $fromStatus = $serviceRequest->status;

        if (! $fromStatus->canTransitionTo($toStatus)) {
            throw StatusConflictException::invalidTransition($serviceRequest, $toStatus);
        }

        DB::transaction(function () use ($serviceRequest, $fromStatus, $toStatus, $expectedVersion, $actor, $remark) {
            // Check and update in one query, so only one of two racing requests wins.
            $updated = ServiceRequest::query()
                ->whereKey($serviceRequest->id)
                ->where('version', $expectedVersion)
                ->update([
                    'status' => $toStatus->value,
                    'version' => DB::raw('version + 1'),
                ]);

            if ($updated === 0) {
                throw StatusConflictException::staleVersion($serviceRequest->refresh());
            }

            $serviceRequest->statusHistories()->create([
                'actor_user_id' => $actor->id,
                'from_status' => $fromStatus,
                'to_status' => $toStatus,
                'remark' => $remark,
            ]);
        });

        return $serviceRequest->refresh();
    }
}
