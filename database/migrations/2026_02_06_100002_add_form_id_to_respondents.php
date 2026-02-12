<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add form_id column
        Schema::table('respondents', function (Blueprint $table) {
            $table->foreignId('form_id')->nullable()->after('id');
        });

        // Migrate existing data: update respondents to use form_id
        $forms = DB::table('forms')->get();
        foreach ($forms as $form) {
            DB::table('respondents')
                ->where('event_id', $form->event_id)
                ->update(['form_id' => $form->id]);
        }

        // Make form_id required and add foreign key
        Schema::table('respondents', function (Blueprint $table) {
            $table->foreign('form_id')->references('id')->on('forms')->onDelete('cascade');
        });

        // Drop old event_id column
        Schema::table('respondents', function (Blueprint $table) {
            $table->dropForeign(['event_id']);
            $table->dropColumn('event_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('respondents', function (Blueprint $table) {
            $table->foreignId('event_id')->nullable()->after('id');
        });

        // Migrate back
        $forms = DB::table('forms')->get();
        foreach ($forms as $form) {
            DB::table('respondents')
                ->where('form_id', $form->id)
                ->update(['event_id' => $form->event_id]);
        }

        Schema::table('respondents', function (Blueprint $table) {
            $table->dropForeign(['form_id']);
            $table->dropColumn('form_id');
            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
        });
    }
};
