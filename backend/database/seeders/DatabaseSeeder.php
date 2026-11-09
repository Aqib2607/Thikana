<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database in strict topological dependency order.
     */
    public function run(): void
    {
        // 1. Static Taxonomies (Environment-safe, idempotent baseline)
        $this->call([
            RoleSeeder::class,
            AmenitySeeder::class,
            AreaSeeder::class,
        ]);

        // 2. Comprehensive Demonstration Dataset
        // HARD SAFETY LOCK: Enforce strict local development environment and loopback host safety.
        DemoSeedingGuard::assertSafeEnvironment();

        $this->call([
            DemoUserSeeder::class,
            CommunityInformationSeeder::class,
            PropertySeeder::class,
            RentalPreferenceSeeder::class,
            InteractionSeeder::class,
            CommunicationSeeder::class,
            AuditLogSeeder::class,
        ]);
    }
}
