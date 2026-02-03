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
        Schema::create('form_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->onDelete('cascade');
            $table->text('question_text'); // Indonesian text
            $table->text('question_text_en')->nullable(); // English translation
            $table->enum('type', ['text', 'textarea', 'rating', 'file', 'multiple_choice']);
            $table->boolean('is_required')->default(false);
            $table->json('options')->nullable(); // For multiple choice options
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_questions');
    }
};
