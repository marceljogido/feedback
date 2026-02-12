<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add respondent_fields JSON to forms
        Schema::table('forms', function (Blueprint $table) {
            $table->json('respondent_fields')->nullable()->after('email_label');
        });

        // Add custom_fields JSON to respondents
        Schema::table('respondents', function (Blueprint $table) {
            $table->json('custom_fields')->nullable()->after('email');
        });

        // Migrate existing collect_name/collect_email data to respondent_fields
        $forms = DB::table('forms')->get();
        foreach ($forms as $form) {
            $fields = [];

            if ($form->collect_name) {
                $fields[] = [
                    'key' => 'name',
                    'label' => $form->name_label ?: 'Nama',
                    'type' => 'text',
                    'enabled' => true,
                ];
            }

            if ($form->collect_email) {
                $fields[] = [
                    'key' => 'email',
                    'label' => $form->email_label ?: 'Email',
                    'type' => 'email',
                    'enabled' => true,
                ];
            }

            if (!empty($fields)) {
                DB::table('forms')->where('id', $form->id)->update([
                    'respondent_fields' => json_encode($fields),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('forms', function (Blueprint $table) {
            $table->dropColumn('respondent_fields');
        });

        Schema::table('respondents', function (Blueprint $table) {
            $table->dropColumn('custom_fields');
        });
    }
};
