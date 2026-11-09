<?php

namespace Tests\Unit;

use App\Models\Property;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_property_generates_slug_from_title(): void
    {
        $slug = Property::generateSlug('Modern Apartment in Khulna');

        $this->assertStringStartsWith('modern-apartment-in-khulna-', $slug);
        $this->assertMatchesRegularExpression('/^modern-apartment-in-khulna-[a-z0-9]{6}$/', $slug);
    }
}
