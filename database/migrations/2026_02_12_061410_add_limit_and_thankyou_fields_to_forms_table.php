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
        Schema::table('forms', function (Blueprint $table) {
            $table->string('thank_you_title')->nullable()->after('allow_edit');
            $table->text('thank_you_message')->nullable()->after('thank_you_title');
            $table->string('thank_you_button_text')->nullable()->after('thank_you_message');
            $table->string('thank_you_button_url')->nullable()->after('thank_you_button_text');
            $table->integer('response_limit')->nullable()->after('thank_you_button_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('forms', function (Blueprint $table) {
            $table->dropColumn([
                'thank_you_title',
                'thank_you_message',
                'thank_you_button_text',
                'thank_you_button_url',
                'response_limit'
            ]);
        });
    }
};
