<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ServiceRequestController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    // Max 5 login attempts per minute to slow down password guessing.
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('requests', [ServiceRequestController::class, 'index']);
    Route::post('requests', [ServiceRequestController::class, 'store']);
    Route::get('requests/{serviceRequest}', [ServiceRequestController::class, 'show']);
    Route::get('requests/{serviceRequest}/history', [ServiceRequestController::class, 'history']);
    Route::patch('requests/{serviceRequest}/status', [ServiceRequestController::class, 'updateStatus']);
});
