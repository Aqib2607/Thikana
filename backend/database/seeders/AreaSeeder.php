<?php

namespace Database\Seeders;

use App\Models\Area;
use Illuminate\Database\Seeder;

class AreaSeeder extends Seeder
{
    /**
     * Seed Khulna municipal areas idempotently.
     */
    public function run(): void
    {
        $areas = [
            [
                'name' => 'Sonadanga R/A',
                'bangla_name' => 'সোনাডাঙ্গা আ/এ',
                'division' => 'Khulna',
                'district' => 'Khulna',
                'city' => 'Khulna',
                'lat' => 22.8185000,
                'lng' => 89.5412000,
            ],
            [
                'name' => 'Boyra',
                'bangla_name' => 'বয়রা',
                'division' => 'Khulna',
                'district' => 'Khulna',
                'city' => 'Khulna',
                'lat' => 22.8341000,
                'lng' => 89.5378000,
            ],
            [
                'name' => 'Mujgunni',
                'bangla_name' => 'মুজগুন্নি',
                'division' => 'Khulna',
                'district' => 'Khulna',
                'city' => 'Khulna',
                'lat' => 22.8492000,
                'lng' => 89.5321000,
            ],
            [
                'name' => 'Nirala',
                'bangla_name' => 'নিরালা',
                'division' => 'Khulna',
                'district' => 'Khulna',
                'city' => 'Khulna',
                'lat' => 22.8091000,
                'lng' => 89.5534000,
            ],
            [
                'name' => 'Khalishpur',
                'bangla_name' => 'খালিশপুর',
                'division' => 'Khulna',
                'district' => 'Khulna',
                'city' => 'Khulna',
                'lat' => 22.8580000,
                'lng' => 89.5300000,
            ],
            [
                'name' => 'Daulatpur',
                'bangla_name' => 'দৌলতপুর',
                'division' => 'Khulna',
                'district' => 'Khulna',
                'city' => 'Khulna',
                'lat' => 22.8856000,
                'lng' => 89.5162000,
            ],
            [
                'name' => 'Shibbari',
                'bangla_name' => 'শিববাড়ি',
                'division' => 'Khulna',
                'district' => 'Khulna',
                'city' => 'Khulna',
                'lat' => 22.8210000,
                'lng' => 89.5540000,
            ],
            [
                'name' => 'Choto Boyra',
                'bangla_name' => 'ছোট বয়রা',
                'division' => 'Khulna',
                'district' => 'Khulna',
                'city' => 'Khulna',
                'lat' => 22.8380000,
                'lng' => 89.5410000,
            ],
            [
                'name' => 'Gollamari',
                'bangla_name' => 'গল্লামারী',
                'division' => 'Khulna',
                'district' => 'Khulna',
                'city' => 'Khulna',
                'lat' => 22.7980000,
                'lng' => 89.5390000,
            ],
            [
                'name' => 'KDA Avenue',
                'bangla_name' => 'কেডিএ এভিনিউ',
                'division' => 'Khulna',
                'district' => 'Khulna',
                'city' => 'Khulna',
                'lat' => 22.8260000,
                'lng' => 89.5510000,
            ],
            [
                'name' => 'Rupsha',
                'bangla_name' => 'রূপসা',
                'division' => 'Khulna',
                'district' => 'Khulna',
                'city' => 'Khulna',
                'lat' => 22.8010000,
                'lng' => 89.5780000,
            ],
        ];

        foreach ($areas as $areaData) {
            Area::updateOrCreate(
                ['name' => $areaData['name']],
                $areaData
            );
        }
    }
}
