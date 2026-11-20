<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('title', 100);
            $table->string('description', 500);
            // Stored as strings (not DB enums) so adding a new value doesn't need an ALTER TABLE.
            // Allowed values are enforced by App\Enums and request validation.
            $table->string('priority', 10);
            $table->string('status', 20)->default('OPEN');
            // Used for optimistic locking on status updates.
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();

            // List page: own requests, newest first, optionally filtered by status + priority.
            $table->index(['created_by', 'created_at']);
            $table->index(['created_by', 'status', 'priority']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_requests');
    }
};
