<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Seed demonstration accounts.
     * Delegates to DemoUserSeeder for full compatibility.
     */
    public function run(): void
    {
        $this->call(DemoUserSeeder::class);
    }
}
