<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create roles
        $superAdmin = Role::create(['name' => 'super_admin']);
        $admin = Role::create(['name' => 'admin']);
        $manager = Role::create(['name' => 'manager']);

        // Create default super admin user
        $user = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@digioh.com',
            'password' => bcrypt('password'),
            'locale' => 'id',
        ]);

        $user->assignRole('super_admin');
    }
}
