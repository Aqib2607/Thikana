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
        Schema::create('community_information', function (Blueprint $table) {
            $table->id();
            $table->foreignId('area_id')->unique()->constrained('areas')->cascadeOnDelete();
            $table->text('transport')->nullable();
            $table->text('waterlogging')->nullable();
            $table->text('internet')->nullable();
            $table->text('noise')->nullable();
            $table->text('safety')->nullable();
            $table->text('general')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('community_information');
    }
};

