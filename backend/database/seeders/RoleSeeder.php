<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Seed static roles taxonomy idempotently.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Tenant',
                'slug' => 'tenant',
                'description' => 'Searches, compares, contacts landlords, and requests visits.',
            ],
            [
                'name' => 'Landlord',
                'slug' => 'landlord',
                'description' => 'Lists and manages rental properties, responds to inquiries.',
            ],
            [
                'name' => 'Administrator',
                'slug' => 'admin',
                'description' => 'System oversight, listing approvals, verification, and audit logs.',
            ],
        ];

        foreach ($roles as $roleData) {
            Role::firstOrCreate(
                ['slug' => $roleData['slug']],
                $roleData
            );
        }
    }
}

