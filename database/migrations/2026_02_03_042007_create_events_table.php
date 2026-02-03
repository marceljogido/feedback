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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('banner_image')->nullable();
            $table->string('logo_image')->nullable();
            $table->enum('status', ['draft', 'active', 'closed'])->default('draft');
            $table->string('locale', 5)->default('id'); // id or en
            $table->json('theme_config')->nullable(); // Custom colors, fonts
            $table->timestamp('event_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
