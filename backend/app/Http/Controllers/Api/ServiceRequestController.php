<?php

namespace App\Http\Controllers\Api;

use App\Enums\RequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ListServiceRequestsRequest;
use App\Http\Requests\StoreServiceRequestRequest;
use App\Http\Requests\UpdateStatusRequest;
use App\Http\Resources\ServiceRequestResource;
use App\Http\Resources\StatusHistoryResource;
use App\Models\ServiceRequest;
use App\Services\StatusTransitionService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class ServiceRequestController extends Controller
{
    public function index(ListServiceRequestsRequest $request): AnonymousResourceCollection
    {
        $serviceRequests = $request->user()->serviceRequests()
            ->when($request->validated('search'), fn ($query, $search) => $query->where('title', 'like', "%{$search}%"))
            ->when($request->validated('status'), fn ($query, $status) => $query->where('status', $status))
            ->when($request->validated('priority'), fn ($query, $priority) => $query->where('priority', $priority))
            ->latest()
            ->latest('id')
            ->paginate($request->validated('per_page', 10))
            ->withQueryString();

        return ServiceRequestResource::collection($serviceRequests);
    }

    public function store(StoreServiceRequestRequest $request): ServiceRequestResource
    {
        // Creating through the user's relationship sets created_by from the session,
        // never from the request body. Status and version use their defaults (OPEN, 1).
        $serviceRequest = $request->user()->serviceRequests()->create($request->validated());

        return new ServiceRequestResource($serviceRequest);
    }

    public function show(ServiceRequest $serviceRequest): ServiceRequestResource
    {
        Gate::authorize('view', $serviceRequest);

        return new ServiceRequestResource($serviceRequest);
    }

    public function history(ServiceRequest $serviceRequest): AnonymousResourceCollection
    {
        Gate::authorize('view', $serviceRequest);

        $history = $serviceRequest->statusHistories()
            ->with('actor')
            ->oldest()
            ->oldest('id')
            ->get();

        return StatusHistoryResource::collection($history);
    }

    public function updateStatus(
        UpdateStatusRequest $request,
        ServiceRequest $serviceRequest,
        StatusTransitionService $statusTransitionService,
    ): ServiceRequestResource {
        $serviceRequest = $statusTransitionService->transition(
            $serviceRequest,
            $request->enum('status', RequestStatus::class),
            $request->integer('expected_version'),
            $request->user(),
            $request->validated('remark'),
        );

        return new ServiceRequestResource($serviceRequest);
    }
}
