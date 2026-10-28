<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PropertyImageConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    protected User $landlord;
    protected string $landlordToken;
    protected Property $property;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $role = Role::firstOrCreate(['slug' => 'landlord'], ['name' => 'Landlord', 'description' => 'Landlord']);

        $this->landlord = new User([
            'name' => 'Image Test Landlord',
            'email' => 'image_landlord@test.com',
            'phone' => '01711113333',
            'password' => bcrypt('Password123!'),
        ]);
        $this->landlord->role_id = $role->id;
        $this->landlord->status = 'active';
        $this->landlord->save();
        $this->landlordToken = $this->landlord->createToken('test', ['role:landlord'])->plainTextToken;

        $this->property = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Image Test Property',
            'slug' => 'image-test-prop-slug',
            'property_type' => 'Apartment / Flat',
            'rental_type' => 'Monthly Rental',
            'rent' => 9000,
            'advance' => 18000,
            'bills_included' => [],
            'available_from' => '2026-11-01',
            'approval_status' => 'Pending Approval',
            'availability' => 'Available',
            'size' => 650,
            'rooms' => 2,
            'bathrooms' => 1,
            'floor' => '2nd',
        ]);
    }

    /**
     * Test image addition cannot exceed the 5-photo maximum limit.
     */
    public function test_image_upload_enforces_five_photo_ceiling(): void
    {
        // Add 5 initial images
        for ($i = 1; $i <= 5; $i++) {
            $this->property->images()->create([
                'image_url' => "https://images.unsplash.com/photo-test-{$i}",
                'is_featured' => ($i === 1),
                'display_order' => $i,
            ]);
        }

        $this->assertEquals(5, $this->property->images()->count());

        // Attempt to upload 6th image
        $file = UploadedFile::fake()->create('extra_photo.jpg', 100, 'image/jpeg');

        $res = $this->withHeader('Authorization', 'Bearer ' . $this->landlordToken)
            ->postJson('/api/v1/landlord/properties/' . $this->property->id . '/images', [
                'image' => $file,
            ]);

        $res->assertStatus(422)
            ->assertJsonStructure(['fieldErrors']);

        // Count remains exactly 5
        $this->assertEquals(5, $this->property->images()->count());
    }

    /**
     * Test deleting the last remaining photo is strictly prohibited (min 1 photo invariant).
     */
    public function test_deleting_last_photo_is_strictly_prohibited(): void
    {
        $image = $this->property->images()->create([
            'image_url' => 'https://images.unsplash.com/photo-only-one',
            'is_featured' => true,
            'display_order' => 1,
        ]);

        $res = $this->withHeader('Authorization', 'Bearer ' . $this->landlordToken)
            ->deleteJson('/api/v1/landlord/properties/' . $this->property->id . '/images/' . $image->id);

        $res->assertStatus(422)
            ->assertJsonStructure(['fieldErrors']);

        $this->assertEquals(1, $this->property->images()->count());
    }

    /**
     * Test deleting the featured photo promotes the next photo in display order.
     */
    public function test_deleting_featured_photo_auto_promotes_next_photo(): void
    {
        $img1 = $this->property->images()->create([
            'image_url' => 'https://images.unsplash.com/photo-1-featured',
            'is_featured' => true,
            'display_order' => 1,
        ]);

        $img2 = $this->property->images()->create([
            'image_url' => 'https://images.unsplash.com/photo-2-next',
            'is_featured' => false,
            'display_order' => 2,
        ]);

        $img3 = $this->property->images()->create([
            'image_url' => 'https://images.unsplash.com/photo-3-third',
            'is_featured' => false,
            'display_order' => 3,
        ]);

        // Delete the featured image (img1)
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->landlordToken)
            ->deleteJson('/api/v1/landlord/properties/' . $this->property->id . '/images/' . $img1->id);

        $res->assertStatus(204);

        $this->assertDatabaseMissing('property_images', ['id' => $img1->id]);

        // Img2 is promoted to featured and display_order = 1
        $this->assertTrue((bool) $img2->fresh()->is_featured);
        $this->assertEquals(1, $img2->fresh()->display_order);

        // Img3 display_order normalized to 2
        $this->assertEquals(2, $img3->fresh()->display_order);
    }

    /**
     * Test reordering images promotes the image at index 0 to featured.
     */
    public function test_reordering_images_promotes_index_zero_to_featured(): void
    {
        $img1 = $this->property->images()->create([
            'image_url' => 'https://images.unsplash.com/photo-A',
            'is_featured' => true,
            'display_order' => 1,
        ]);

        $img2 = $this->property->images()->create([
            'image_url' => 'https://images.unsplash.com/photo-B',
            'is_featured' => false,
            'display_order' => 2,
        ]);

        // Reorder putting img2 first
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->landlordToken)
            ->putJson('/api/v1/landlord/properties/' . $this->property->id . '/images/reorder', [
                'imageIds' => [$img2->id, $img1->id],
            ]);

        $res->assertStatus(200);

        $this->assertTrue((bool) $img2->fresh()->is_featured);
        $this->assertEquals(1, $img2->fresh()->display_order);

        $this->assertFalse((bool) $img1->fresh()->is_featured);
        $this->assertEquals(2, $img1->fresh()->display_order);
    }
}
