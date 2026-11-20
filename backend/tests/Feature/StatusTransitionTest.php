<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Exceptions\StatusConflictException;
use App\Models\RequestStatusHistory;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Services\StatusTransitionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use RuntimeException;
use Tests\TestCase;

class StatusTransitionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
    }

    public function test_valid_transition_updates_status_increments_version_and_writes_one_history_row(): void
    {
        $serviceRequest = $this->createRequest(RequestStatus::Open, 1);

        $response = $this->actingAs($this->user)->patchJson($this->url($serviceRequest), [
            'status' => 'IN_PROGRESS',
            'expected_version' => 1,
            'remark' => 'Technician assigned',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'IN_PROGRESS')
            ->assertJsonPath('data.version', 2)
            ->assertJsonPath('data.allowed_transitions', ['RESOLVED']);

        $this->assertDatabaseHas('service_requests', [
            'id' => $serviceRequest->id,
            'status' => 'IN_PROGRESS',
            'version' => 2,
        ]);
        $this->assertDatabaseCount('request_status_histories', 1);
        $this->assertDatabaseHas('request_status_histories', [
            'service_request_id' => $serviceRequest->id,
            'actor_user_id' => $this->user->id,
            'from_status' => 'OPEN',
            'to_status' => 'IN_PROGRESS',
            'remark' => 'Technician assigned',
        ]);
    }

    public function test_request_can_go_through_the_full_workflow(): void
    {
        $serviceRequest = $this->createRequest(RequestStatus::Open, 1);

        $this->actingAs($this->user)
            ->patchJson($this->url($serviceRequest), ['status' => 'IN_PROGRESS', 'expected_version' => 1])
            ->assertOk();

        $this->actingAs($this->user)
            ->patchJson($this->url($serviceRequest), ['status' => 'RESOLVED', 'expected_version' => 2])
            ->assertOk()
            ->assertJsonPath('data.status', 'RESOLVED')
            ->assertJsonPath('data.version', 3)
            ->assertJsonPath('data.allowed_transitions', []);

        $this->assertDatabaseCount('request_status_histories', 2);
    }

    public static function invalidTransitions(): array
    {
        return [
            'skip OPEN to RESOLVED' => [RequestStatus::Open, 1, 'RESOLVED'],
            'reverse IN_PROGRESS to OPEN' => [RequestStatus::InProgress, 2, 'OPEN'],
            'no-op OPEN to OPEN' => [RequestStatus::Open, 1, 'OPEN'],
            'no-op IN_PROGRESS to IN_PROGRESS' => [RequestStatus::InProgress, 2, 'IN_PROGRESS'],
            'RESOLVED is final' => [RequestStatus::Resolved, 3, 'IN_PROGRESS'],
            'RESOLVED back to OPEN' => [RequestStatus::Resolved, 3, 'OPEN'],
        ];
    }

    #[DataProvider('invalidTransitions')]
    public function test_invalid_transition_returns_409_and_changes_nothing(RequestStatus $from, int $version, string $to): void
    {
        $serviceRequest = $this->createRequest($from, $version);

        $this->actingAs($this->user)
            ->patchJson($this->url($serviceRequest), ['status' => $to, 'expected_version' => $version])
            ->assertConflict()
            ->assertJsonPath('reason', 'invalid_transition')
            ->assertJsonPath('current_status', $from->value)
            ->assertJsonPath('current_version', $version);

        $this->assertDatabaseHas('service_requests', [
            'id' => $serviceRequest->id,
            'status' => $from->value,
            'version' => $version,
        ]);
        $this->assertDatabaseCount('request_status_histories', 0);
    }

    public function test_stale_version_returns_409_without_overwriting_the_latest_state(): void
    {
        // Someone already moved it to IN_PROGRESS (version 2), but this client still has version 1.
        $serviceRequest = $this->createRequest(RequestStatus::InProgress, 2);

        $this->actingAs($this->user)
            ->patchJson($this->url($serviceRequest), ['status' => 'RESOLVED', 'expected_version' => 1])
            ->assertConflict()
            ->assertJsonPath('reason', 'stale_version')
            ->assertJsonPath('current_status', 'IN_PROGRESS')
            ->assertJsonPath('current_version', 2);

        $this->assertDatabaseHas('service_requests', [
            'id' => $serviceRequest->id,
            'status' => 'IN_PROGRESS',
            'version' => 2,
        ]);
        $this->assertDatabaseCount('request_status_histories', 0);
    }

    public function test_second_update_with_the_same_version_is_rejected(): void
    {
        // Two browser tabs loaded version 1 and both try to update.
        $serviceRequest = $this->createRequest(RequestStatus::Open, 1);
        $body = ['status' => 'IN_PROGRESS', 'expected_version' => 1];

        $this->actingAs($this->user)->patchJson($this->url($serviceRequest), $body)->assertOk();
        $this->actingAs($this->user)->patchJson($this->url($serviceRequest), $body)
            ->assertConflict()
            ->assertJsonPath('reason', 'stale_version');

        $this->assertSame(2, $serviceRequest->fresh()->version);
        $this->assertDatabaseCount('request_status_histories', 1);
    }

    public function test_atomic_update_rejects_a_change_that_happened_after_the_request_was_loaded(): void
    {
        // Simulates a real race: this request loaded version 1, then another
        // request saved first. The in-memory check passes, so only the
        // "UPDATE ... WHERE version = 1" in the database can catch it.
        $serviceRequest = $this->createRequest(RequestStatus::Open, 1);
        ServiceRequest::whereKey($serviceRequest->id)->update(['status' => 'IN_PROGRESS', 'version' => 2]);

        try {
            app(StatusTransitionService::class)->transition($serviceRequest, RequestStatus::InProgress, 1, $this->user);
            $this->fail('Expected a StatusConflictException.');
        } catch (StatusConflictException $e) {
            $this->assertSame('stale_version', $e->reason);
        }

        $this->assertDatabaseHas('service_requests', ['id' => $serviceRequest->id, 'status' => 'IN_PROGRESS', 'version' => 2]);
        $this->assertDatabaseCount('request_status_histories', 0);
    }

    public function test_status_change_is_rolled_back_if_history_cannot_be_saved(): void
    {
        $serviceRequest = $this->createRequest(RequestStatus::Open, 1);

        RequestStatusHistory::creating(function () {
            throw new RuntimeException('History insert failed');
        });

        $this->actingAs($this->user)
            ->patchJson($this->url($serviceRequest), ['status' => 'IN_PROGRESS', 'expected_version' => 1])
            ->assertServerError();

        $this->assertDatabaseHas('service_requests', [
            'id' => $serviceRequest->id,
            'status' => 'OPEN',
            'version' => 1,
        ]);
        $this->assertDatabaseCount('request_status_histories', 0);
    }

    public function test_invalid_body_returns_422(): void
    {
        $serviceRequest = $this->createRequest(RequestStatus::Open, 1);

        $this->actingAs($this->user)
            ->patchJson($this->url($serviceRequest), [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status', 'expected_version']);

        $this->actingAs($this->user)
            ->patchJson($this->url($serviceRequest), [
                'status' => 'DONE',
                'expected_version' => 'abc',
                'remark' => str_repeat('a', 256),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status', 'expected_version', 'remark']);

        $this->assertDatabaseCount('request_status_histories', 0);
    }

    public function test_user_cannot_change_status_of_another_users_request(): void
    {
        $serviceRequest = $this->createRequest(RequestStatus::Open, 1);
        $intruder = User::factory()->create();

        $this->actingAs($intruder)
            ->patchJson($this->url($serviceRequest), ['status' => 'IN_PROGRESS', 'expected_version' => 1])
            ->assertNotFound();

        // Still 404 (not 422) with an invalid body, so the request's existence isn't revealed.
        $this->actingAs($intruder)
            ->patchJson($this->url($serviceRequest), [])
            ->assertNotFound();

        $this->assertDatabaseHas('service_requests', ['id' => $serviceRequest->id, 'status' => 'OPEN', 'version' => 1]);
        $this->assertDatabaseCount('request_status_histories', 0);
    }

    public function test_unknown_request_returns_404_and_guest_gets_401(): void
    {
        $body = ['status' => 'IN_PROGRESS', 'expected_version' => 1];

        $this->actingAs($this->user)->patchJson('/api/requests/999999/status', $body)->assertNotFound();

        $this->app['auth']->forgetGuards();
        $serviceRequest = $this->createRequest(RequestStatus::Open, 1);
        $this->patchJson($this->url($serviceRequest), $body)->assertUnauthorized();
    }

    private function createRequest(RequestStatus $status, int $version): ServiceRequest
    {
        return ServiceRequest::factory()
            ->for($this->user, 'creator')
            ->status($status, $version)
            ->create();
    }

    private function url(ServiceRequest $serviceRequest): string
    {
        return "/api/requests/{$serviceRequest->id}/status";
    }
}
