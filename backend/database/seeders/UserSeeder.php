<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Seed academic demonstration accounts.
     * HARD SAFETY GUARD: Never seed demo accounts in production.
     */
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command?->warn('Production environment detected: Skipping demo user seeding.');
            return;
        }

        $tenantRole = Role::where('slug', 'tenant')->first();
        $landlordRole = Role::where('slug', 'landlord')->first();
        $adminRole = Role::where('slug', 'admin')->first();

        // 1. Demo Tenant
        User::updateOrCreate(
            ['email' => 'tenant@demo.test'],
            [
                'name' => 'রাফি আহমেদ',
                'phone' => '01711111111',
                'role_id' => $tenantRole?->id,
                'status' => 'active',
                'password' => 'Password1',
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
            ]
        );

        // 2. Demo Landlord
        User::updateOrCreate(
            ['email' => 'landlord@demo.test'],
            [
                'name' => 'করিম হোসেন',
                'phone' => '01822222222',
                'role_id' => $landlordRole?->id,
                'status' => 'active',
                'password' => 'Password1',
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
            ]
        );

        // 3. Demo Admin
        User::updateOrCreate(
            ['email' => 'admin@demo.test'],
            [
                'name' => 'অ্যাডমিন',
                'phone' => '01933333333',
                'role_id' => $adminRole?->id,
                'status' => 'active',
                'password' => 'Password1',
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
            ]
        );
    }
}

