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
        Schema::create('answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('respondent_id')->constrained()->onDelete('cascade');
            $table->foreignId('form_question_id')->constrained('form_questions')->onDelete('cascade');
            $table->text('answer_text')->nullable(); // For text answers
            $table->integer('answer_numeric')->nullable(); // For rating (1-5)
            $table->string('file_path')->nullable(); // For file uploads
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('answers');
    }
};
