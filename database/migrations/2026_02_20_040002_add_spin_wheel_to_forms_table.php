<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('forms', function (Blueprint $table) {
            $table->boolean('spin_wheel_enabled')->default(false);
            $table->string('spin_wheel_title')->nullable();
            $table->string('spin_wheel_btn_text')->default('PUTAR!');
            $table->string('spin_wheel_btn_color', 7)->default('#f17720');
            $table->string('spin_wheel_pointer_color', 7)->default('#e74c3c');
            $table->string('spin_wheel_sound_spin')->nullable(); // custom MP3 path
            $table->string('spin_wheel_sound_stop')->nullable();
            $table->string('spin_wheel_sound_win')->nullable();
            $table->text('spin_wheel_result_message')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('forms', function (Blueprint $table) {
            $table->dropColumn([
                'spin_wheel_enabled',
                'spin_wheel_title',
                'spin_wheel_btn_text',
                'spin_wheel_btn_color',
                'spin_wheel_pointer_color',
                'spin_wheel_sound_spin',
                'spin_wheel_sound_stop',
                'spin_wheel_sound_win',
                'spin_wheel_result_message',
            ]);
        });
    }
};
