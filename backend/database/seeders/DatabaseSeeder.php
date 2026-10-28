<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Static taxonomy
        $this->call([
            RoleSeeder::class,
        ]);

        // 2. Demo users only in non-production
        if (!app()->environment('production')) {
            $this->call([
                UserSeeder::class,
            ]);
        }
    }
}
