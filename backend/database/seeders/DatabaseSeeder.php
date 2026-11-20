<?php

namespace Database\Seeders;

use App\Enums\RequestPriority;
use App\Enums\RequestStatus;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    // Demo accounts for local use only. Both use the password "password".
    public function run(): void
    {
        $alice = User::factory()->create([
            'name' => 'Alice Perera',
            'email' => 'alice@example.com',
            'password' => 'password',
        ]);

        $bob = User::factory()->create([
            'name' => 'Bob Fernando',
            'email' => 'bob@example.com',
            'password' => 'password',
        ]);

        $this->createRequest($alice, 'Printer not working', 'Office printer on the 2nd floor stopped responding.', RequestPriority::High);
        $this->createRequest($alice, 'Need a second monitor', 'Requesting an extra monitor for the design team desk.', RequestPriority::Low, [
            [RequestStatus::InProgress, 'Order placed with supplier'],
        ]);
        $this->createRequest($alice, 'VPN keeps disconnecting', 'VPN drops every 10 minutes when working from home.', RequestPriority::Medium, [
            [RequestStatus::InProgress, 'Checking VPN client logs'],
            [RequestStatus::Resolved, 'Updated VPN client to the latest version'],
        ]);

        $this->createRequest($bob, 'Laptop battery drains quickly', 'Battery lasts less than an hour after the last update.', RequestPriority::Medium);
        $this->createRequest($bob, 'Access to shared finance folder', 'Need read access to the finance team shared drive.', RequestPriority::High, [
            [RequestStatus::InProgress, null],
        ]);
    }

    /**
     * Creates a request and walks it through the given status changes,
     * so the seeded history and version always match the current status.
     *
     * @param  array<array{0: RequestStatus, 1: ?string}>  $changes
     */
    private function createRequest(User $owner, string $title, string $description, RequestPriority $priority, array $changes = []): void
    {
        $request = $owner->serviceRequests()->create([
            'title' => $title,
            'description' => $description,
            'priority' => $priority,
        ]);

        foreach ($changes as [$toStatus, $remark]) {
            $request->statusHistories()->create([
                'actor_user_id' => $owner->id,
                'from_status' => $request->status,
                'to_status' => $toStatus,
                'remark' => $remark,
            ]);

            $request->status = $toStatus;
            $request->version++;
            $request->save();
        }
    }
}
