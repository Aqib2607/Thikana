<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('rental_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->foreignId('preferred_area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->decimal('max_budget', 10, 2)->nullable();
            $table->string('preferred_property_type')->nullable();
            $table->unsignedTinyInteger('min_rooms')->nullable();
            $table->unsignedTinyInteger('min_bathrooms')->nullable();
            $table->string('preferred_furnished')->nullable();
            $table->timestamps();

            $table->index('preferred_area_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rental_preferences');
    }
};

