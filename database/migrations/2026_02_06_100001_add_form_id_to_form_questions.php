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
        Schema::table('form_questions', function (Blueprint $table) {
            $table->foreignId('form_id')->nullable()->after('id');
        });

        // Migrate existing data: create forms for existing events and update form_questions
        $events = DB::table('events')->get();
        foreach ($events as $event) {
            // Check if this event has questions
            $hasQuestions = DB::table('form_questions')->where('event_id', $event->id)->exists();
            
            if ($hasQuestions) {
                // Create a default form for this event
                $formId = DB::table('forms')->insertGetId([
                    'event_id' => $event->id,
                    'name' => 'Form Utama',
                    'slug' => $event->slug,
                    'description' => $event->description,
                    'status' => $event->status,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Update form_questions to use the new form_id
                DB::table('form_questions')
                    ->where('event_id', $event->id)
                    ->update(['form_id' => $formId]);
            }
        }

        // Make form_id required and add foreign key
        Schema::table('form_questions', function (Blueprint $table) {
            $table->foreign('form_id')->references('id')->on('forms')->onDelete('cascade');
        });

        // Drop old event_id column
        Schema::table('form_questions', function (Blueprint $table) {
            $table->dropForeign(['event_id']);
            $table->dropColumn('event_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('form_questions', function (Blueprint $table) {
            $table->foreignId('event_id')->nullable()->after('id');
        });

        // Migrate back: get event_id from form
        $forms = DB::table('forms')->get();
        foreach ($forms as $form) {
            DB::table('form_questions')
                ->where('form_id', $form->id)
                ->update(['event_id' => $form->event_id]);
        }

        Schema::table('form_questions', function (Blueprint $table) {
            $table->dropForeign(['form_id']);
            $table->dropColumn('form_id');
            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
        });
    }
};
