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

    // Demo users. Password: "password".
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

        // More requests for Alice, so the list has two pages.
        $this->createRequest($alice, 'Keyboard keys sticking', 'Several keys on my keyboard stick when typing.', RequestPriority::Low);
        $this->createRequest($alice, 'Wi-Fi drops in meeting room B', 'The Wi-Fi connection drops every few minutes in room B.', RequestPriority::Medium, [
            [RequestStatus::InProgress, 'Network team is checking the access point'],
        ]);
        $this->createRequest($alice, 'Need access to the HR portal', 'I need access to the HR portal to submit leave requests.', RequestPriority::Medium, [
            [RequestStatus::InProgress, null],
            [RequestStatus::Resolved, 'Access granted'],
        ]);
        $this->createRequest($alice, 'Laptop running very slow', 'My laptop takes several minutes to open basic apps.', RequestPriority::High);
        $this->createRequest($alice, 'Replace broken office chair', 'The height adjustment on my chair is broken.', RequestPriority::Low);
        $this->createRequest($alice, 'Install Figma on my laptop', 'I need Figma installed for the new design project.', RequestPriority::Low, [
            [RequestStatus::InProgress, null],
            [RequestStatus::Resolved, 'Installed and licensed'],
        ]);
        $this->createRequest($alice, 'Email not syncing on phone', 'Work email stopped syncing on my phone since Monday.', RequestPriority::Medium);
        $this->createRequest($alice, 'Monitor flickering', 'The second monitor flickers when the laptop is docked.', RequestPriority::High, [
            [RequestStatus::InProgress, 'Replacement cable ordered'],
        ]);
        $this->createRequest($alice, 'Projector remote missing', 'The remote for the projector in room 4 is missing.', RequestPriority::Low);
    }

    // Creates a request and applies each status change, so history and version match.
    /** @param  array<array{0: RequestStatus, 1: ?string}>  $changes */
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
