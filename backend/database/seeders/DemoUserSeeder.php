<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class DemoUserSeeder extends Seeder
{
    /**
     * Seed academic demonstration accounts.
     * HARD SAFETY GUARD: Never seed demo accounts in production or staging.
     */
    public function run(): void
    {
        DemoSeedingGuard::assertSafeEnvironment();

        $tenantRole = Role::where('slug', 'tenant')->firstOrFail();
        $landlordRole = Role::where('slug', 'landlord')->firstOrFail();
        $adminRole = Role::where('slug', 'admin')->firstOrFail();

        $configuredPassword = config('app.demo_password');
        $passwordString = is_string($configuredPassword) && $configuredPassword !== '' ? $configuredPassword : 'Password1';
        $defaultPassword = Hash::make($passwordString);

        // 1. Initial System Administrator
        $adminData = [
            'name' => 'রাশেদুল হাসান',
            'email' => 'admin@demo.test',
            'phone' => '01933333333',
            'role_id' => $adminRole->id,
            'status' => 'active',
        ];
        $this->upsertDemoUser($adminData, $defaultPassword);

        // 2. Eight Landlords
        $landlords = [
            [
                'name' => 'করিম হোসেন',
                'email' => 'landlord@demo.test',
                'phone' => '01822222222',
                'role_id' => $landlordRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'শামসুল আলম',
                'email' => 'landlord2@demo.test',
                'phone' => '01712345601',
                'role_id' => $landlordRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'ফারহানা পারভীন',
                'email' => 'landlord3@demo.test',
                'phone' => '01812345602',
                'role_id' => $landlordRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'মজিবুর রহমান',
                'email' => 'landlord4@demo.test',
                'phone' => '01912345603',
                'role_id' => $landlordRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'নাসরিন সুলতানা',
                'email' => 'landlord5@demo.test',
                'phone' => '01612345604',
                'role_id' => $landlordRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'আব্দুল কাদের',
                'email' => 'landlord6@demo.test',
                'phone' => '01512345605',
                'role_id' => $landlordRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'শাহিনুর ইসলাম',
                'email' => 'landlord7@demo.test',
                'phone' => '01712345606',
                'role_id' => $landlordRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'রেহানা বেগম',
                'email' => 'landlord8@demo.test',
                'phone' => '01812345607',
                'role_id' => $landlordRole->id,
                'status' => 'active',
            ],
        ];

        foreach ($landlords as $landlordData) {
            $this->upsertDemoUser($landlordData, $defaultPassword);
        }

        // 3. Twenty Tenants
        $tenants = [
            [
                'name' => 'রাফি আহমেদ',
                'email' => 'tenant@demo.test',
                'phone' => '01711111111',
                'role_id' => $tenantRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'তানভীর তানিম',
                'email' => 'tenant2@demo.test',
                'phone' => '01722222201',
                'role_id' => $tenantRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'সাদিয়া হক',
                'email' => 'tenant3@demo.test',
                'phone' => '01722222202',
                'role_id' => $tenantRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'মাহমুদ উল্লাহ',
                'email' => 'tenant4@demo.test',
                'phone' => '01722222203',
                'role_id' => $tenantRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'তাহমিনা আক্তার',
                'email' => 'tenant5@demo.test',
                'phone' => '01722222204',
                'role_id' => $tenantRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'ইমরান নাজির',
                'email' => 'tenant6@demo.test',
                'phone' => '01722222205',
                'role_id' => $tenantRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'ফারিয়া জামান',
                'email' => 'tenant7@demo.test',
                'phone' => '01722222206',
                'role_id' => $tenantRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'আসিফ ইকবাল',
                'email' => 'tenant8@demo.test',
                'phone' => '01722222207',
                'role_id' => $tenantRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'মেহজাবিন চৌধুরী',
                'email' => 'tenant9@demo.test',
                'phone' => '01722222208',
                'role_id' => $tenantRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'সাকিব আল হাসান',
                'email' => 'tenant10@demo.test',
                'phone' => '01722222209',
                'role_id' => $tenantRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'নুসরাত জাহান',
                'email' => 'tenant11@demo.test',
                'phone' => '01722222210',
                'role_id' => $tenantRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'আরিফুল ইসলাম',
                'email' => 'tenant12@demo.test',
                'phone' => '01722222211',
                'role_id' => $tenantRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'রুকসানা আক্তার',
                'email' => 'tenant13@demo.test',
                'phone' => '01722222212',
                'role_id' => $tenantRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'কামরুল হাসান',
                'email' => 'tenant14@demo.test',
                'phone' => '01722222213',
                'role_id' => $tenantRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'নাদিয়া সুলতানা',
                'email' => 'tenant15@demo.test',
                'phone' => '01722222214',
                'role_id' => $tenantRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'মেহেদী হাসান',
                'email' => 'tenant16@demo.test',
                'phone' => '01722222215',
                'role_id' => $tenantRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'সুমাইয়া খাতুন',
                'email' => 'tenant17@demo.test',
                'phone' => '01722222216',
                'role_id' => $tenantRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'জাহিদুল ইসলাম',
                'email' => 'tenant18@demo.test',
                'phone' => '01722222217',
                'role_id' => $tenantRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'শারমিন জাহান',
                'email' => 'tenant19@demo.test',
                'phone' => '01722222218',
                'role_id' => $tenantRole->id,
                'status' => 'active',
            ],
            [
                'name' => 'ফয়সাল আহমেদ',
                'email' => 'tenant20@demo.test',
                'phone' => '01722222219',
                'role_id' => $tenantRole->id,
                'status' => 'suspended', // Suspended account for access control testing
            ],
        ];

        foreach ($tenants as $tenantData) {
            $this->upsertDemoUser($tenantData, $defaultPassword);
        }
    }

    /**
     * Idempotently create or update a single demo account.
     * Guarantees role_id, status, and verification timestamps are explicitly persisted.
     *
     * @param  array<string, mixed>  $data
     */
    private function upsertDemoUser(array $data, string $defaultPassword): void
    {
        /** @var User $user */
        $user = User::firstOrNew(['email' => $data['email']]);
        $user->name = $data['name'];
        $user->phone = $data['phone'];
        $user->role_id = $data['role_id'];
        $user->status = $data['status'];

        if (! $user->exists || empty($user->password)) {
            $user->password = $defaultPassword;
        }

        if (empty($user->email_verified_at)) {
            $user->email_verified_at = Carbon::now();
        }

        if (empty($user->phone_verified_at)) {
            $user->phone_verified_at = Carbon::now();
        }

        $user->save();
    }
}
