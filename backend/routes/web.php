<?php

use Illuminate\Support\Facades\Route;

// API only. The UI is the Next.js app.
Route::get('/', fn () => response()->json([
    'name' => config('app.name'),
    'status' => 'ok',
]));
