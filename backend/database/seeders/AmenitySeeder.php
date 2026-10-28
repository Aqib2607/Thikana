<?php

namespace Database\Seeders;

use App\Models\Amenity;
use Illuminate\Database\Seeder;

class AmenitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $amenities = [
            [
                'name' => 'High-Speed WiFi',
                'bangla_name' => 'হাই-স্পিড ওয়াইফাই',
                'icon' => 'Wifi',
            ],
            [
                'name' => 'Generator / IPS Backup',
                'bangla_name' => 'জেনারেটর / আইপিএস ব্যাকআপ',
                'icon' => 'Zap',
            ],
            [
                'name' => '24/7 Deep Tube-Well Water',
                'bangla_name' => '২৪/৭ গভীর নলকূপের পানি',
                'icon' => 'Droplets',
            ],
            [
                'name' => 'Security Guard',
                'bangla_name' => 'নিরাপত্তা প্রহরী',
                'icon' => 'ShieldCheck',
            ],
            [
                'name' => 'CCTV Surveillance',
                'bangla_name' => 'সিসিটিভি নজরদারি',
                'icon' => 'Camera',
            ],
            [
                'name' => 'Attached Bathroom',
                'bangla_name' => 'সংযুক্ত বাথরুম',
                'icon' => 'Bath',
            ],
            [
                'name' => 'Private Balcony',
                'bangla_name' => 'ব্যক্তিগত বারান্দা',
                'icon' => 'Sun',
            ],
            [
                'name' => 'Dining Space',
                'bangla_name' => 'ডাইনিং স্পেস',
                'icon' => 'Utensils',
            ],
            [
                'name' => 'Refrigerator',
                'bangla_name' => 'রেফ্রিজারেটর',
                'icon' => 'Cpu',
            ],
            [
                'name' => 'Daily Meal / Mess System',
                'bangla_name' => 'দৈনিক খাবার / মেস সুবিধা',
                'icon' => 'Coffee',
            ],
            [
                'name' => 'Rooftop Access',
                'bangla_name' => 'ছাদে যাতায়াতের সুবিধা',
                'icon' => 'Layers',
            ],
            [
                'name' => 'Motorbike Parking',
                'bangla_name' => 'মোটরসাইকেল পার্কিং',
                'icon' => 'Car',
            ],
            [
                'name' => 'Gas Pipeline / Cylinder',
                'bangla_name' => 'গ্যাস সংযোগ / সিলিন্ডার',
                'icon' => 'Flame',
            ],
            [
                'name' => 'Elevator / Lift',
                'bangla_name' => 'লিফট সুবিধা',
                'icon' => 'ArrowUpSquare',
            ],
        ];

        foreach ($amenities as $item) {
            Amenity::updateOrCreate(
                ['name' => $item['name']],
                [
                    'bangla_name' => $item['bangla_name'],
                    'icon' => $item['icon'],
                ]
            );
        }
    }
}

