<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Sanctum only uses sessions for requests from the frontend.
        $this->withHeader('Referer', config('app.frontend_url'));
    }
}
