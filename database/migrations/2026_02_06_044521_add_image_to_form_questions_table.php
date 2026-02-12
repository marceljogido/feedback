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
        Schema::table('form_questions', function (Blueprint $table) {
            // Image for the question itself (shown above the question text)
            $table->string('image')->nullable()->after('question_text_en');
            
            // For multiple choice: store options as JSON with optional images
            // Format: [{"text": "Option A", "image": "path/to/image.jpg"}, ...]
            // We'll rename 'options' column to store this new format
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('form_questions', function (Blueprint $table) {
            $table->dropColumn('image');
        });
    }
};
