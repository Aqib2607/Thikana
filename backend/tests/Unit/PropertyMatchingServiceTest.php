<?php

namespace Tests\Unit;

use App\Models\Amenity;
use App\Models\Area;
use App\Models\Property;
use App\Models\PropertyLocation;
use App\Models\RentalPreference;
use App\Services\Matching\PropertyMatchingService;
use PHPUnit\Framework\TestCase;

class PropertyMatchingServiceTest extends TestCase
{
    protected PropertyMatchingService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PropertyMatchingService();
    }

    public function test_returns_empty_result_when_preference_is_null(): void
    {
        $property = new Property(['rent' => 10000, 'availability' => 'Available']);
        $result = $this->service->calculate(null, $property);

        $this->assertFalse($result['hasTenantPreferences']);
        $this->assertSame(0, $result['overallPercentage']);
        $this->assertSame(0, $result['locationScore']);
        $this->assertSame(0, $result['budgetScore']);
    }

    public function test_returns_empty_result_when_preference_has_no_meaningful_preferences(): void
    {
        $preference = new RentalPreference([
            'preferred_area_id' => null,
            'max_budget' => null,
            'preferred_property_type' => null,
            'min_rooms' => null,
            'min_bathrooms' => null,
        ]);
        $preference->setRelation('amenities', collect());

        $property = new Property(['rent' => 10000, 'availability' => 'Available']);
        $result = $this->service->calculate($preference, $property);

        $this->assertFalse($result['hasTenantPreferences']);
        $this->assertSame(0, $result['overallPercentage']);
    }

    public function test_full_match_scores_100_percent(): void
    {
        $area = new Area(['id' => 1, 'name' => 'Boyra']);
        $preference = new RentalPreference([
            'preferred_area_id' => 1,
            'max_budget' => 15000,
            'preferred_property_type' => 'Apartment / Flat',
            'min_rooms' => 3,
            'min_bathrooms' => 2,
        ]);
        $preference->setRelation('preferredArea', $area);

        $amenity1 = new Amenity(['id' => 1, 'name' => 'WiFi']);
        $amenity2 = new Amenity(['id' => 2, 'name' => 'Lift']);
        $preference->setRelation('amenities', collect([$amenity1, $amenity2]));

        $location = new PropertyLocation(['area' => 'Boyra']);
        $property = new Property([
            'rent' => 12000,
            'property_type' => 'Apartment / Flat',
            'rooms' => 3,
            'bathrooms' => 2,
            'availability' => 'Available',
        ]);
        $property->setRelation('location', $location);
        $property->setRelation('amenities', collect([$amenity1, $amenity2]));

        $result = $this->service->calculate($preference, $property);

        $this->assertTrue($result['hasTenantPreferences']);
        $this->assertSame(30, $result['locationScore']);
        $this->assertSame(25, $result['budgetScore']);
        $this->assertSame(15, $result['propertyTypeScore']);
        $this->assertSame(5, $result['roomsScore']);
        $this->assertSame(5, $result['bathroomsScore']);
        $this->assertSame(10, $result['roomsAndBathsScore']);
        $this->assertSame(15, $result['amenitiesScore']);
        $this->assertSame(5, $result['availabilityScore']);
        $this->assertSame(100, $result['overallPercentage']);
    }

    public function test_budget_scoring_within_and_exceeding_budget(): void
    {
        $preference = new RentalPreference(['max_budget' => 10000]);
        $preference->setRelation('amenities', collect());

        // Exactly at budget => 25 pts + 5 avail = 30 / 30 = 100%
        $propAt = new Property(['rent' => 10000, 'availability' => 'Available']);
        $resAt = $this->service->calculate($preference, $propAt);
        $this->assertSame(25, $resAt['budgetScore']);
        $this->assertSame(100, $resAt['overallPercentage']);

        // 20% over budget (12,000): diff = 0.2, penalty = round(25 * (1 - 0.4)) = 15
        $propOver = new Property(['rent' => 12000, 'availability' => 'Available']);
        $resOver = $this->service->calculate($preference, $propOver);
        $this->assertSame(15, $resOver['budgetScore']);
        // (15 + 5) / (25 + 5) = 20 / 30 = 67%
        $this->assertSame(67, $resOver['overallPercentage']);

        // 60% over budget (16,000): diff = 0.6, penalty = round(25 * (1 - 1.2)) = -5 => max(0, -5) = 0
        $propFar = new Property(['rent' => 16000, 'availability' => 'Available']);
        $resFar = $this->service->calculate($preference, $propFar);
        $this->assertSame(0, $resFar['budgetScore']);
        // (0 + 5) / 30 = 17%
        $this->assertSame(17, $resFar['overallPercentage']);
    }

    public function test_location_mismatch_scores_zero_and_retains_weight(): void
    {
        $area = new Area(['id' => 1, 'name' => 'Sonadanga']);
        $preference = new RentalPreference(['preferred_area_id' => 1]);
        $preference->setRelation('preferredArea', $area);
        $preference->setRelation('amenities', collect());

        $locationMismatch = new PropertyLocation(['area' => 'Khalishpur']);
        $property = new Property(['availability' => 'Available']);
        $property->setRelation('location', $locationMismatch);

        $result = $this->service->calculate($preference, $property);
        $this->assertSame(0, $result['locationScore']);
        $this->assertSame(5, $result['availabilityScore']);
        // (0 + 5) / (30 + 5) = 5 / 35 = 14%
        $this->assertSame(14, $result['overallPercentage']);
    }

    public function test_proportional_rooms_and_bathrooms_scoring(): void
    {
        $preference = new RentalPreference([
            'min_rooms' => 4,
            'min_bathrooms' => 2,
        ]);
        $preference->setRelation('amenities', collect());

        $property = new Property([
            'rooms' => 2,      // 5 * (2/4) = 2.5 => round 3
            'bathrooms' => 1,  // 5 * (1/2) = 2.5 => round 3
            'availability' => 'Available',
        ]);

        $result = $this->service->calculate($preference, $property);
        $this->assertSame(3, $result['roomsScore']);
        $this->assertSame(3, $result['bathroomsScore']);
        $this->assertSame(6, $result['roomsAndBathsScore']);
        // Denominator = 5 + 5 + 5 = 15. Numerator = 3 + 3 + 5 = 11. (11 / 15) * 100 = 73%
        $this->assertSame(73, $result['overallPercentage']);
    }

    public function test_availability_inherent_scoring(): void
    {
        $preference = new RentalPreference(['max_budget' => 10000]);
        $preference->setRelation('amenities', collect());

        // Available: 5 points
        $propAvail = new Property(['rent' => 10000, 'availability' => 'Available']);
        $resAvail = $this->service->calculate($preference, $propAvail);
        $this->assertSame(5, $resAvail['availabilityScore']);

        // Reserved: 0 points
        $propRes = new Property(['rent' => 10000, 'availability' => 'Reserved']);
        $resRes = $this->service->calculate($preference, $propRes);
        $this->assertSame(0, $resRes['availabilityScore']);
        // Numerator: 25 + 0 = 25. Denominator: 25 + 5 = 30. (25 / 30) * 100 = 83%
        $this->assertSame(83, $resRes['overallPercentage']);
    }

    public function test_missing_property_attributes_score_zero(): void
    {
        $preference = new RentalPreference([
            'max_budget' => 10000,
            'min_rooms' => 3,
        ]);
        $preference->setRelation('amenities', collect());

        // Property with missing rooms
        $property = new Property(['rent' => 10000, 'rooms' => null, 'availability' => 'Available']);
        $result = $this->service->calculate($preference, $property);

        $this->assertSame(25, $result['budgetScore']);
        $this->assertSame(0, $result['roomsScore']);
        $this->assertSame(5, $result['availabilityScore']);
        // Denominator: 25 + 5 + 5 = 35. Numerator: 25 + 0 + 5 = 30. (30 / 35) * 100 = 86%
        $this->assertSame(86, $result['overallPercentage']);
    }
}
