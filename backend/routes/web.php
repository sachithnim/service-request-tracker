<?php

use Illuminate\Support\Facades\Route;

// The backend is API-only. The web UI lives in the Next.js frontend.
Route::get('/', fn () => response()->json([
    'name' => config('app.name'),
    'status' => 'ok',
]));
