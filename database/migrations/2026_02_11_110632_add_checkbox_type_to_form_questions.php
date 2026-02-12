<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Change the column type from enum to varchar to support any question type
        DB::statement("ALTER TABLE form_questions ALTER COLUMN type TYPE VARCHAR(50)");
    }

    public function down(): void
    {
        // Revert back - optional, keeping varchar is fine
    }
};
