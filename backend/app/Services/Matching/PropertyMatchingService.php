<?php

namespace App\Services\Matching;

use App\Models\Property;
use App\Models\RentalPreference;
use Illuminate\Support\Collection;

class PropertyMatchingService
{
    public const WEIGHT_LOCATION = 30;
    public const WEIGHT_BUDGET = 25;
    public const WEIGHT_PROPERTY_TYPE = 15;
    public const WEIGHT_ROOMS = 5;
    public const WEIGHT_BATHROOMS = 5;
    public const WEIGHT_AMENITIES = 15;
    public const WEIGHT_AVAILABILITY = 5;

    /**
     * Calculate deterministic match breakdown for a property against tenant preferences.
     *
     * @return array{
     *     overallPercentage: int,
     *     locationScore: int,
     *     budgetScore: int,
     *     propertyTypeScore: int,
     *     roomsScore: int,
     *     bathroomsScore: int,
     *     roomsAndBathsScore: int,
     *     amenitiesScore: int,
     *     availabilityScore: int,
     *     hasTenantPreferences: bool
     * }
     */
    public function calculate(?RentalPreference $preference, Property $property): array
    {
        $emptyResult = [
            'overallPercentage' => 0,
            'locationScore' => 0,
            'budgetScore' => 0,
            'propertyTypeScore' => 0,
            'roomsScore' => 0,
            'bathroomsScore' => 0,
            'roomsAndBathsScore' => 0,
            'amenitiesScore' => 0,
            'availabilityScore' => 0,
            'hasTenantPreferences' => false,
        ];

        if ($preference === null || !$preference->hasMeaningfulPreferences()) {
            return $emptyResult;
        }

        $applicableWeights = 0;
        $earnedScores = 0;

        $locationScore = 0;
        $budgetScore = 0;
        $propertyTypeScore = 0;
        $roomsScore = 0;
        $bathroomsScore = 0;
        $amenitiesScore = 0;
        $availabilityScore = 0;

        // 1. Location (Weight: 30)
        $preferredAreaName = $preference->relationLoaded('preferredArea')
            ? $preference->preferredArea?->name
            : ($preference->preferred_area_id !== null ? $preference->preferredArea?->name : null);
        if ($preferredAreaName !== null && trim($preferredAreaName) !== '') {
            $applicableWeights += self::WEIGHT_LOCATION;
            /** @var \App\Models\PropertyLocation|null $propertyLocation */
            $propertyLocation = $property->location;
            $propertyArea = $propertyLocation?->area;
            if ($propertyArea !== null && strcasecmp(trim($propertyArea), trim($preferredAreaName)) === 0) {
                $locationScore = self::WEIGHT_LOCATION;
                $earnedScores += $locationScore;
            }
        }

        // 2. Budget (Weight: 25)
        if ($preference->max_budget !== null && $preference->max_budget > 0) {
            $applicableWeights += self::WEIGHT_BUDGET;
            $propertyRent = (float) $property->rent;
            if ($propertyRent > 0) {
                if ($propertyRent <= (float) $preference->max_budget) {
                    $budgetScore = self::WEIGHT_BUDGET;
                } else {
                    $diff = ($propertyRent - (float) $preference->max_budget) / (float) $preference->max_budget;
                    $penalty = (int) round(self::WEIGHT_BUDGET * (1 - 2 * $diff));
                    $budgetScore = max(0, $penalty);
                }
                $earnedScores += $budgetScore;
            }
        }

        // 3. Property Type (Weight: 15)
        $preferredType = $preference->preferred_property_type;
        if ($preferredType !== null && trim($preferredType) !== '' && strcasecmp(trim($preferredType), 'Any') !== 0) {
            $applicableWeights += self::WEIGHT_PROPERTY_TYPE;
            $propertyType = $property->property_type;
            if ($propertyType !== null && strcasecmp(trim($propertyType), trim($preferredType)) === 0) {
                $propertyTypeScore = self::WEIGHT_PROPERTY_TYPE;
                $earnedScores += $propertyTypeScore;
            }
        }

        // 4. Rooms (Weight: 5)
        if ($preference->min_rooms !== null && $preference->min_rooms > 0) {
            $applicableWeights += self::WEIGHT_ROOMS;
            $propertyRooms = (int) $property->rooms;
            if ($propertyRooms > 0) {
                $roomsScore = min(self::WEIGHT_ROOMS, (int) round(self::WEIGHT_ROOMS * ($propertyRooms / (int) $preference->min_rooms)));
                $earnedScores += $roomsScore;
            }
        }

        // 5. Bathrooms (Weight: 5)
        if ($preference->min_bathrooms !== null && $preference->min_bathrooms > 0) {
            $applicableWeights += self::WEIGHT_BATHROOMS;
            $propertyBathrooms = (int) $property->bathrooms;
            if ($propertyBathrooms > 0) {
                $bathroomsScore = min(self::WEIGHT_BATHROOMS, (int) round(self::WEIGHT_BATHROOMS * ($propertyBathrooms / (int) $preference->min_bathrooms)));
                $earnedScores += $bathroomsScore;
            }
        }

        // 6. Amenities (Weight: 15)
        $requiredAmenities = $preference->relationLoaded('amenities')
            ? $preference->amenities->pluck('name')->map(fn ($n) => trim((string) $n))->filter()->values()
            : collect();

        if ($requiredAmenities->isNotEmpty()) {
            $applicableWeights += self::WEIGHT_AMENITIES;
            $reqCount = $requiredAmenities->count();

            $propertyAmenities = $property->relationLoaded('amenities')
                ? $property->amenities->pluck('name')->map(fn ($n) => strtolower(trim((string) $n)))->all()
                : [];

            $matchCount = 0;
            foreach ($requiredAmenities as $req) {
                if (in_array(strtolower($req), $propertyAmenities, true)) {
                    $matchCount++;
                }
            }

            $amenitiesScore = min(self::WEIGHT_AMENITIES, (int) round(self::WEIGHT_AMENITIES * ($matchCount / $reqCount)));
            $earnedScores += $amenitiesScore;
        }

        // 7. Availability (Weight: 5, Inherent)
        if ($applicableWeights > 0) {
            $applicableWeights += self::WEIGHT_AVAILABILITY;
            if ($property->availability === 'Available') {
                $availabilityScore = self::WEIGHT_AVAILABILITY;
                $earnedScores += $availabilityScore;
            }
        }

        $overallPercentage = $applicableWeights > 0
            ? min(100, max(0, (int) round(($earnedScores / $applicableWeights) * 100)))
            : 0;

        return [
            'overallPercentage' => $overallPercentage,
            'locationScore' => $locationScore,
            'budgetScore' => $budgetScore,
            'propertyTypeScore' => $propertyTypeScore,
            'roomsScore' => $roomsScore,
            'bathroomsScore' => $bathroomsScore,
            'roomsAndBathsScore' => $roomsScore + $bathroomsScore,
            'amenitiesScore' => $amenitiesScore,
            'availabilityScore' => $availabilityScore,
            'hasTenantPreferences' => true,
        ];
    }
}
