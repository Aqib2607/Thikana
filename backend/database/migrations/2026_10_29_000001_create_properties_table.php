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
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('landlord_id')->constrained('users')->cascadeOnDelete();
            $table->string('title', 255);
            $table->string('bangla_title', 255)->nullable();
            $table->string('slug', 255)->unique();
            $table->string('property_type', 50)->index();
            $table->string('rental_type', 50)->index();
            $table->decimal('rent', 10, 2)->index();
            $table->decimal('advance', 10, 2)->default(0);
            $table->decimal('additional_charges', 10, 2)->default(0);
            $table->json('bills_included');
            $table->string('availability', 50)->default('Available')->index();
            $table->date('available_from');
            $table->string('approval_status', 50)->default('Pending Approval')->index();
            $table->unsignedInteger('size');
            $table->unsignedSmallInteger('rooms');
            $table->unsignedSmallInteger('bathrooms');
            $table->unsignedSmallInteger('balconies')->default(0);
            $table->string('floor', 50);
            $table->unsignedSmallInteger('total_floors')->nullable();
            $table->string('furnished_status', 50)->default('Unfurnished');
            $table->string('preferred_tenant', 50)->default('Any');
            $table->boolean('public_contact_visible')->default(false);
            $table->json('community_info')->nullable();
            $table->decimal('rating', 3, 2)->default(0.00);
            $table->unsignedInteger('review_count')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};

