<?php

namespace Tests\Feature;

use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ErrorResponseTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Nothing should leak, even in debug mode.
        config(['app.debug' => true]);
    }

    public function test_another_users_request_and_an_unknown_request_return_the_same_404(): void
    {
        $user = User::factory()->create();
        $othersRequest = ServiceRequest::factory()->create();

        $notYours = $this->actingAs($user)->getJson("/api/requests/{$othersRequest->id}");
        $unknown = $this->actingAs($user)->getJson('/api/requests/999999');

        $notYours->assertNotFound()->assertExactJson(['message' => 'Resource not found.']);
        $unknown->assertNotFound()->assertExactJson(['message' => 'Resource not found.']);
        $this->assertSame($unknown->getContent(), $notYours->getContent());
    }

    public function test_unknown_api_route_returns_clean_404(): void
    {
        $this->getJson('/api/does-not-exist')
            ->assertNotFound()
            ->assertExactJson(['message' => 'Resource not found.']);
    }

    public function test_wrong_http_method_returns_clean_405(): void
    {
        $user = User::factory()->create();
        $serviceRequest = ServiceRequest::factory()->for($user, 'creator')->create();

        $response = $this->actingAs($user)->deleteJson("/api/requests/{$serviceRequest->id}");

        $response->assertMethodNotAllowed()
            ->assertJsonStructure(['message'])
            ->assertJsonMissingPath('exception')
            ->assertJsonMissingPath('trace');
    }

    public function test_unauthenticated_and_validation_errors_keep_their_shape(): void
    {
        $this->getJson('/api/requests')
            ->assertUnauthorized()
            ->assertExactJson(['message' => 'Unauthenticated.']);

        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/requests', [])
            ->assertUnprocessable()
            ->assertJsonStructure(['message', 'errors' => ['title', 'description', 'priority']])
            ->assertJsonMissingPath('trace');
    }

    public function test_conflict_errors_include_reason_and_current_state(): void
    {
        $user = User::factory()->create();
        $serviceRequest = ServiceRequest::factory()->for($user, 'creator')->create();

        $this->actingAs($user)
            ->patchJson("/api/requests/{$serviceRequest->id}/status", ['status' => 'RESOLVED', 'expected_version' => 1])
            ->assertConflict()
            ->assertExactJson([
                'message' => 'Cannot change status from OPEN to RESOLVED.',
                'reason' => 'invalid_transition',
                'current_status' => 'OPEN',
                'current_version' => 1,
            ]);
    }
}
