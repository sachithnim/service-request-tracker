<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServiceRequestAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_view_request_detail_with_version(): void
    {
        $user = User::factory()->create();
        $serviceRequest = ServiceRequest::factory()->for($user, 'creator')->create();

        $this->actingAs($user)->getJson("/api/requests/{$serviceRequest->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $serviceRequest->id)
            ->assertJsonPath('data.status', 'OPEN')
            ->assertJsonPath('data.version', 1)
            ->assertJsonPath('data.allowed_transitions', ['IN_PROGRESS']);
    }

    public function test_user_cannot_access_another_users_request_detail_or_history(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $serviceRequest = ServiceRequest::factory()->for($owner, 'creator')->create();

        $this->actingAs($intruder)->getJson("/api/requests/{$serviceRequest->id}")->assertNotFound();
        $this->actingAs($intruder)->getJson("/api/requests/{$serviceRequest->id}/history")->assertNotFound();
        $this->actingAs($intruder)->getJson('/api/requests')->assertJsonCount(0, 'data');
    }

    public function test_unknown_request_returns_404(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/requests/999999')->assertNotFound();
        $this->actingAs($user)->getJson('/api/requests/999999/history')->assertNotFound();
    }

    public function test_guest_cannot_view_detail_or_history(): void
    {
        $serviceRequest = ServiceRequest::factory()->create();

        $this->getJson("/api/requests/{$serviceRequest->id}")->assertUnauthorized();
        $this->getJson("/api/requests/{$serviceRequest->id}/history")->assertUnauthorized();
    }

    public function test_owner_can_view_history_in_chronological_order(): void
    {
        $user = User::factory()->create();
        $serviceRequest = ServiceRequest::factory()->for($user, 'creator')
            ->status(RequestStatus::Resolved, 3)
            ->create();

        $serviceRequest->statusHistories()->create([
            'actor_user_id' => $user->id,
            'from_status' => RequestStatus::Open,
            'to_status' => RequestStatus::InProgress,
            'remark' => 'Technician assigned',
        ]);
        $serviceRequest->statusHistories()->create([
            'actor_user_id' => $user->id,
            'from_status' => RequestStatus::InProgress,
            'to_status' => RequestStatus::Resolved,
            'remark' => null,
        ]);

        $this->actingAs($user)->getJson("/api/requests/{$serviceRequest->id}/history")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.from_status', 'OPEN')
            ->assertJsonPath('data.0.to_status', 'IN_PROGRESS')
            ->assertJsonPath('data.0.remark', 'Technician assigned')
            ->assertJsonPath('data.0.actor.id', $user->id)
            ->assertJsonPath('data.1.to_status', 'RESOLVED');
    }
}
