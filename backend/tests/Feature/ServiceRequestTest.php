<?php

namespace Tests\Feature;

use App\Enums\RequestPriority;
use App\Enums\RequestStatus;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServiceRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_a_request(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/requests', [
            'title' => 'Printer not working',
            'description' => 'Office printer stopped responding.',
            'priority' => 'HIGH',
            // These must be ignored: the server decides them.
            'created_by' => $otherUser->id,
            'status' => 'RESOLVED',
            'version' => 9,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.title', 'Printer not working')
            ->assertJsonPath('data.priority', 'HIGH')
            ->assertJsonPath('data.status', 'OPEN')
            ->assertJsonPath('data.version', 1);

        $this->assertDatabaseHas('service_requests', [
            'id' => $response->json('data.id'),
            'created_by' => $user->id,
            'status' => 'OPEN',
            'version' => 1,
        ]);
    }

    public function test_create_returns_422_for_missing_fields(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/requests', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'description', 'priority']);

        $this->assertDatabaseCount('service_requests', 0);
    }

    public function test_create_returns_422_for_invalid_values(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/requests', [
            'title' => 'ab',
            'description' => 'too short',
            'priority' => 'URGENT',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'description', 'priority']);

        $this->actingAs($user)->postJson('/api/requests', [
            'title' => str_repeat('a', 101),
            'description' => str_repeat('a', 501),
            'priority' => 'LOW',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'description']);
    }

    public function test_create_accepts_values_at_the_exact_limits(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/requests', [
            'title' => 'abc',
            'description' => str_repeat('a', 10),
            'priority' => 'LOW',
        ])->assertCreated();

        $this->actingAs($user)->postJson('/api/requests', [
            'title' => str_repeat('a', 100),
            'description' => str_repeat('a', 500),
            'priority' => 'MEDIUM',
        ])->assertCreated();
    }

    public function test_guest_cannot_create_or_list_requests(): void
    {
        $this->postJson('/api/requests', [])->assertUnauthorized();
        $this->getJson('/api/requests')->assertUnauthorized();
    }

    public function test_list_only_shows_own_requests_newest_first(): void
    {
        $user = User::factory()->create();
        $older = ServiceRequest::factory()->for($user, 'creator')->create(['created_at' => now()->subDay()]);
        $newer = ServiceRequest::factory()->for($user, 'creator')->create();
        ServiceRequest::factory()->create(); // belongs to someone else

        $this->actingAs($user)->getJson('/api/requests')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $newer->id)
            ->assertJsonPath('data.1.id', $older->id)
            ->assertJsonPath('meta.total', 2);
    }

    public function test_list_can_search_by_title(): void
    {
        $user = User::factory()->create();
        ServiceRequest::factory()->for($user, 'creator')->create(['title' => 'Printer not working']);
        ServiceRequest::factory()->for($user, 'creator')->create(['title' => 'VPN keeps disconnecting']);

        $this->actingAs($user)->getJson('/api/requests?search=printer')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Printer not working');
    }

    public function test_search_treats_percent_and_underscore_as_normal_characters(): void
    {
        $user = User::factory()->create();
        ServiceRequest::factory()->for($user, 'creator')->create(['title' => 'Disk 100% full']);
        ServiceRequest::factory()->for($user, 'creator')->create(['title' => 'Rename file_name.txt']);
        ServiceRequest::factory()->for($user, 'creator')->create(['title' => 'Printer not working']);

        $this->actingAs($user)->getJson('/api/requests?search=%25')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Disk 100% full');

        $this->actingAs($user)->getJson('/api/requests?search=_')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Rename file_name.txt');
    }

    public function test_list_can_filter_by_status_and_priority_together(): void
    {
        $user = User::factory()->create();
        $match = ServiceRequest::factory()->for($user, 'creator')
            ->status(RequestStatus::InProgress, 2)
            ->create(['priority' => RequestPriority::High]);
        ServiceRequest::factory()->for($user, 'creator')->create(['priority' => RequestPriority::High]);
        ServiceRequest::factory()->for($user, 'creator')
            ->status(RequestStatus::InProgress, 2)
            ->create(['priority' => RequestPriority::Low]);

        $this->actingAs($user)->getJson('/api/requests?status=IN_PROGRESS&priority=HIGH')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $match->id);
    }

    public function test_list_is_paginated_with_default_10_and_max_25(): void
    {
        $user = User::factory()->create();
        ServiceRequest::factory()->count(30)->for($user, 'creator')->create();

        $this->actingAs($user)->getJson('/api/requests')
            ->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('meta.total', 30);

        $this->actingAs($user)->getJson('/api/requests?per_page=25&page=2')
            ->assertOk()
            ->assertJsonCount(5, 'data');

        $this->actingAs($user)->getJson('/api/requests?per_page=26')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('per_page');
    }

    public function test_list_returns_422_for_invalid_filters(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/requests?status=DONE&priority=URGENT')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status', 'priority']);
    }
}
