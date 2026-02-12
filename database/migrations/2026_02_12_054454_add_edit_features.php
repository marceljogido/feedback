<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add allow_edit flag to forms
        Schema::table('forms', function (Blueprint $table) {
            $table->boolean('allow_edit')->default(false)->after('closes_at');
        });

        // Add edit_token to respondents
        Schema::table('respondents', function (Blueprint $table) {
            $table->string('edit_token', 64)->nullable()->unique()->after('ip_address');
        });
    }

    public function down(): void
    {
        Schema::table('forms', function (Blueprint $table) {
            $table->dropColumn('allow_edit');
        });

        Schema::table('respondents', function (Blueprint $table) {
            $table->dropColumn('edit_token');
        });
    }
};
