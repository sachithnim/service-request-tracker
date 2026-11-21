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
            // Strings, not DB enums: new values need no migration.
            $table->string('priority', 10);
            $table->string('status', 20)->default('OPEN');
            // For optimistic locking.
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();

            // For the list page queries.
            $table->index(['created_by', 'created_at']);
            $table->index(['created_by', 'status', 'priority']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_requests');
    }
};
