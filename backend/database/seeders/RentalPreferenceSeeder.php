<?php

namespace Database\Seeders;

use App\Models\Amenity;
use App\Models\Area;
use App\Models\RentalPreference;
use App\Models\User;
use Illuminate\Database\Seeder;

class RentalPreferenceSeeder extends Seeder
{
    /**
     * Seed rental search preference profiles for 15 demo tenants.
     */
    public function run(): void
    {
        $tenants = User::where('email', 'like', 'tenant%@demo.test')
            ->orderBy('id')
            ->take(15)
            ->get();

        $areas = Area::all()->keyBy('name');
        $amenities = Amenity::all();

        $preferenceProfiles = [
            // Tenant 1
            [
                'area' => 'Sonadanga R/A',
                'max_budget' => 18000.00,
                'property_type' => 'Family Apartment',
                'min_rooms' => 3,
                'min_bathrooms' => 2,
                'furnished' => 'Semi-Furnished',
                'amenity_count' => 5,
            ],
            // Tenant 2
            [
                'area' => 'Boyra',
                'max_budget' => 6000.00,
                'property_type' => 'Sublet / Single Room',
                'min_rooms' => 1,
                'min_bathrooms' => 1,
                'furnished' => 'Furnished',
                'amenity_count' => 4,
            ],
            // Tenant 3
            [
                'area' => 'Mujgunni',
                'max_budget' => 12000.00,
                'property_type' => 'Family Apartment',
                'min_rooms' => 2,
                'min_bathrooms' => 2,
                'furnished' => 'Unfurnished',
                'amenity_count' => 4,
            ],
            // Tenant 4
            [
                'area' => 'Nirala',
                'max_budget' => 25000.00,
                'property_type' => 'Family Apartment',
                'min_rooms' => 3,
                'min_bathrooms' => 3,
                'furnished' => 'Semi-Furnished',
                'amenity_count' => 6,
            ],
            // Tenant 5
            [
                'area' => 'Gollamari',
                'max_budget' => 4000.00,
                'property_type' => 'Student Mess',
                'min_rooms' => 1,
                'min_bathrooms' => 1,
                'furnished' => 'Furnished',
                'amenity_count' => 5,
            ],
            // Tenant 6
            [
                'area' => 'Khalishpur',
                'max_budget' => 9000.00,
                'property_type' => 'Bachelor Flat',
                'min_rooms' => 2,
                'min_bathrooms' => 1,
                'furnished' => 'Unfurnished',
                'amenity_count' => 3,
            ],
            // Tenant 7
            [
                'area' => 'Shibbari',
                'max_budget' => 26000.00,
                'property_type' => 'Family Apartment',
                'min_rooms' => 3,
                'min_bathrooms' => 3,
                'furnished' => 'Furnished',
                'amenity_count' => 7,
            ],
            // Tenant 8
            [
                'area' => 'KDA Avenue',
                'max_budget' => 35000.00,
                'property_type' => 'Duplex',
                'min_rooms' => 4,
                'min_bathrooms' => 4,
                'furnished' => 'Furnished',
                'amenity_count' => 8,
            ],
            // Tenant 9
            [
                'area' => 'Daulatpur',
                'max_budget' => 8500.00,
                'property_type' => 'Bachelor Flat',
                'min_rooms' => 2,
                'min_bathrooms' => 1,
                'furnished' => 'Unfurnished',
                'amenity_count' => 4,
            ],
            // Tenant 10
            [
                'area' => 'Choto Boyra',
                'max_budget' => 10000.00,
                'property_type' => 'Family Apartment',
                'min_rooms' => 2,
                'min_bathrooms' => 2,
                'furnished' => 'Unfurnished',
                'amenity_count' => 4,
            ],
            // Tenant 11
            [
                'area' => 'Rupsha',
                'max_budget' => 14000.00,
                'property_type' => 'Family Apartment',
                'min_rooms' => 3,
                'min_bathrooms' => 2,
                'furnished' => 'Unfurnished',
                'amenity_count' => 5,
            ],
            // Tenant 12
            [
                'area' => 'Sonadanga R/A',
                'max_budget' => 5000.00,
                'property_type' => 'Sublet / Single Room',
                'min_rooms' => 1,
                'min_bathrooms' => 1,
                'furnished' => 'Semi-Furnished',
                'amenity_count' => 4,
            ],
            // Tenant 13
            [
                'area' => 'Boyra',
                'max_budget' => 16000.00,
                'property_type' => 'Family Apartment',
                'min_rooms' => 3,
                'min_bathrooms' => 2,
                'furnished' => 'Unfurnished',
                'amenity_count' => 5,
            ],
            // Tenant 14
            [
                'area' => 'Mujgunni',
                'max_budget' => 4500.00,
                'property_type' => 'Student Mess',
                'min_rooms' => 1,
                'min_bathrooms' => 1,
                'furnished' => 'Furnished',
                'amenity_count' => 4,
            ],
            // Tenant 15
            [
                'area' => 'Nirala',
                'max_budget' => 30000.00,
                'property_type' => 'Duplex',
                'min_rooms' => 4,
                'min_bathrooms' => 3,
                'furnished' => 'Semi-Furnished',
                'amenity_count' => 7,
            ],
        ];

        foreach ($tenants as $index => $tenant) {
            $prefData = $preferenceProfiles[$index % count($preferenceProfiles)];
            $preferredArea = $areas->get($prefData['area']);

            /** @var RentalPreference $pref */
            $pref = RentalPreference::updateOrCreate(
                ['user_id' => $tenant->id],
                [
                    'preferred_area_id' => $preferredArea?->id,
                    'max_budget' => $prefData['max_budget'],
                    'preferred_property_type' => $prefData['property_type'],
                    'min_rooms' => $prefData['min_rooms'],
                    'min_bathrooms' => $prefData['min_bathrooms'],
                    'preferred_furnished' => $prefData['furnished'],
                ]
            );

            if ($amenities->isNotEmpty()) {
                $count = $prefData['amenity_count'];
                $amenitySubset = $amenities->take($count);
                $pref->amenities()->sync($amenitySubset->pluck('id')->toArray());
            }
        }
    }
}
