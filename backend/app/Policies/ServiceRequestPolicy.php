<?php

namespace App\Policies;

use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ServiceRequestPolicy
{
    // Other users' requests return 404 (not 403) so nobody can tell
    // whether a request with that ID exists.
    public function view(User $user, ServiceRequest $serviceRequest): Response
    {
        return $serviceRequest->created_by === $user->id
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    // Only the owner can change the status of their request.
    public function update(User $user, ServiceRequest $serviceRequest): Response
    {
        return $this->view($user, $serviceRequest);
    }
}
