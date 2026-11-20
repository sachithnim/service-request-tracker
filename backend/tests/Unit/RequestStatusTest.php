<?php

namespace Tests\Unit;

use App\Enums\RequestStatus;
use PHPUnit\Framework\TestCase;

class RequestStatusTest extends TestCase
{
    public function test_status_can_only_move_one_step_forward(): void
    {
        $this->assertTrue(RequestStatus::Open->canTransitionTo(RequestStatus::InProgress));
        $this->assertTrue(RequestStatus::InProgress->canTransitionTo(RequestStatus::Resolved));
    }

    public function test_skipping_reversing_and_no_op_transitions_are_not_allowed(): void
    {
        $this->assertFalse(RequestStatus::Open->canTransitionTo(RequestStatus::Resolved));
        $this->assertFalse(RequestStatus::InProgress->canTransitionTo(RequestStatus::Open));
        $this->assertFalse(RequestStatus::Open->canTransitionTo(RequestStatus::Open));
    }

    public function test_resolved_is_final(): void
    {
        $this->assertSame([], RequestStatus::Resolved->allowedTransitions());
    }
}
