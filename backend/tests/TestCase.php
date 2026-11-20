<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Sanctum only starts a session for requests coming from the SPA,
        // so make every test request look like it came from the frontend.
        $this->withHeader('Referer', config('app.frontend_url'));
    }
}
