<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('forms', function (Blueprint $table) {
            // Rename stop → bgm
            $table->renameColumn('spin_wheel_sound_stop', 'spin_wheel_sound_bgm');
        });

        Schema::table('forms', function (Blueprint $table) {
            // Add per-sound toggle columns
            $table->boolean('spin_wheel_sound_bgm_enabled')->default(true)->after('spin_wheel_sound_bgm');
            $table->boolean('spin_wheel_sound_spin_enabled')->default(true)->after('spin_wheel_sound_spin');
            $table->boolean('spin_wheel_sound_win_enabled')->default(true)->after('spin_wheel_sound_win');
        });
    }

    public function down(): void
    {
        Schema::table('forms', function (Blueprint $table) {
            $table->dropColumn([
                'spin_wheel_sound_bgm_enabled',
                'spin_wheel_sound_spin_enabled',
                'spin_wheel_sound_win_enabled',
            ]);
        });

        Schema::table('forms', function (Blueprint $table) {
            $table->renameColumn('spin_wheel_sound_bgm', 'spin_wheel_sound_stop');
        });
    }
};
