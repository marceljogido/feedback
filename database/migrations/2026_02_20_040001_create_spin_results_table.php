<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spin_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('respondent_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('prize_id')->nullable()->constrained()->nullOnDelete();
            $table->string('phone_number')->nullable();
            $table->enum('status', ['won', 'claimed', 'expired'])->default('won');
            $table->timestamp('claimed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spin_results');
    }
};
