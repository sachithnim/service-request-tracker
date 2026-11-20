<?php

namespace App\Enums;

enum RequestStatus: string
{
    case Open = 'OPEN';
    case InProgress = 'IN_PROGRESS';
    case Resolved = 'RESOLVED';

    /**
     * Statuses this one can move to. The workflow only goes forward,
     * one step at a time, and RESOLVED is final.
     *
     * @return array<RequestStatus>
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Open => [self::InProgress],
            self::InProgress => [self::Resolved],
            self::Resolved => [],
        };
    }

    public function canTransitionTo(self $status): bool
    {
        return in_array($status, $this->allowedTransitions(), true);
    }
}
