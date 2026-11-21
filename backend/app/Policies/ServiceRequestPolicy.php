<?php

namespace App\Policies;

use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ServiceRequestPolicy
{
    // 404 (not 403), so other users' IDs stay hidden.
    public function view(User $user, ServiceRequest $serviceRequest): Response
    {
        return $serviceRequest->created_by === $user->id
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    public function update(User $user, ServiceRequest $serviceRequest): Response
    {
        return $this->view($user, $serviceRequest);
    }
}
