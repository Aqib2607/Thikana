<?php

namespace Tests\Feature;

use App\Http\Requests\UpdatePropertyRequest;
use App\Models\Property;
use App\Models\PropertyLocation;
use Tests\TestCase;

class PropertyModelTest extends TestCase
{
    /**
     * Test slug generation produces expected stable formatted slug.
     */
    public function test_property_generates_stable_slug(): void
    {
        $slug = Property::generateSlug('Modern 2-Bed Flat near KUET');

        $this->assertStringStartsWith('modern-2-bed-flat-near-kuet-', $slug);
        $this->assertEquals(strlen('modern-2-bed-flat-near-kuet-') + 6, strlen($slug));
    }

    /**
     * Test canonical Khulna area coordinate resolution.
     */
    public function test_property_location_resolves_canonical_khulna_areas(): void
    {
        $resolved = PropertyLocation::resolveAreaCoordinates('KUET Gate / Teligati');
        $this->assertNotNull($resolved);
        $this->assertEquals(22.8997, $resolved['lat']);
        $this->assertEquals(89.5028, $resolved['lng']);

        $sonadanga = PropertyLocation::resolveAreaCoordinates('Sonadanga R/A');
        $this->assertNotNull($sonadanga);
        $this->assertEquals(22.8252, $sonadanga['lat']);
        $this->assertEquals(89.5441, $sonadanga['lng']);

        $unknown = PropertyLocation::resolveAreaCoordinates('Nonexistent Area');
        $this->assertNull($unknown);
    }

    /**
     * Test regional bounding box validation.
     */
    public function test_property_location_validates_regional_bounds(): void
    {
        // Valid coordinates inside Khulna bounds
        $this->assertTrue(PropertyLocation::isValidRegionalCoordinate(22.8456, 89.5403));
        $this->assertTrue(PropertyLocation::isValidRegionalCoordinate(22.8997, 89.5028));

        // Invalid coordinates outside Khulna bounds (e.g. Dhaka, London, or equator)
        $this->assertFalse(PropertyLocation::isValidRegionalCoordinate(23.8103, 90.4125)); // Dhaka
        $this->assertFalse(PropertyLocation::isValidRegionalCoordinate(51.5074, -0.1278)); // London
        $this->assertFalse(PropertyLocation::isValidRegionalCoordinate(0.0, 0.0));
    }

    /**
     * Test UpdatePropertyRequest material change detection.
     */
    public function test_update_property_request_detects_material_changes(): void
    {
        // Material change: rent
        $materialRequest = new UpdatePropertyRequest();
        $materialRequest->merge(['rent' => 12000]);
        $this->assertTrue($materialRequest->hasMaterialChanges());

        // Material change: size
        $sizeRequest = new UpdatePropertyRequest();
        $sizeRequest->merge(['size' => 850]);
        $this->assertTrue($sizeRequest->hasMaterialChanges());

        // Non-material change: banglaTitle only
        $nonMaterialRequest = new UpdatePropertyRequest();
        $nonMaterialRequest->merge(['banglaTitle' => 'নতুন বাংলা শিরোনাম']);
        $this->assertFalse($nonMaterialRequest->hasMaterialChanges());

        // Non-material change: furnishedStatus
        $minorRequest = new UpdatePropertyRequest();
        $minorRequest->merge(['furnishedStatus' => 'Furnished']);
        $this->assertFalse($minorRequest->hasMaterialChanges());
    }
}

