<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('form_questions', function (Blueprint $table) {
            $table->text('description')->nullable()->after('question_text_en');
            $table->text('description_en')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('form_questions', function (Blueprint $table) {
            $table->dropColumn(['description', 'description_en']);
        });
    }
};
