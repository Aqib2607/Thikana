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
        Schema::create('property_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->unique()->constrained('properties')->cascadeOnDelete();
            $table->string('division', 50)->default('Khulna')->index();
            $table->string('district', 50)->default('Khulna')->index();
            $table->string('city', 50)->default('Khulna')->index();
            $table->string('area', 100)->index();
            $table->text('exact_address');
            $table->decimal('lat', 10, 7)->default(22.8456);
            $table->decimal('lng', 10, 7)->default(89.5403);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('property_locations');
    }
};

