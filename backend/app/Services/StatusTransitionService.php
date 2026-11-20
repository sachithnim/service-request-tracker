<?php

namespace App\Services;

use App\Enums\RequestStatus;
use App\Exceptions\StatusConflictException;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class StatusTransitionService
{
    /**
     * Moves a request to a new status using optimistic locking.
     *
     * @throws StatusConflictException when the version is stale or the transition isn't allowed
     */
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
            // The version check and the update happen in one SQL statement, so if two
            // requests race with the same version, only one of them can match the row.
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
