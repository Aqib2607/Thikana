<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\Role;
use App\Models\User;
use App\Services\ImageManagementService;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PropertyImageStorageTest extends TestCase
{
    use RefreshDatabase;

    protected User $landlord;
    protected string $landlordToken;
    protected Property $property;
    protected ImageManagementService $imageService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->imageService = app(ImageManagementService::class);

        $role = Role::firstOrCreate(['slug' => 'landlord'], ['name' => 'Landlord', 'description' => 'Landlord']);

        $this->landlord = new User([
            'name' => 'Storage Test Landlord',
            'email' => 'storage_landlord@test.com',
            'phone' => '01711114444',
            'password' => bcrypt('Password123!'),
        ]);
        $this->landlord->role_id = $role->id;
        $this->landlord->status = 'active';
        $this->landlord->save();
        $this->landlordToken = $this->landlord->createToken('test', ['role:landlord'])->plainTextToken;

        $this->property = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Storage Test Property',
            'slug' => 'storage-test-prop-slug',
            'property_type' => 'Apartment / Flat',
            'rental_type' => 'Monthly Rental',
            'rent' => 12000,
            'advance' => 24000,
            'bills_included' => [],
            'available_from' => '2026-11-01',
            'approval_status' => 'Pending Approval',
            'availability' => 'Available',
            'size' => 800,
            'rooms' => 3,
            'bathrooms' => 2,
            'floor' => '3rd',
        ]);
    }

    /**
     * Get the test filesystem adapter with explicit typing for IDE static analysis.
     */
    protected function disk(string $name): FilesystemAdapter
    {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk($name);

        return $disk;
    }

    /**
     * Create a valid fake image file with binary JPEG header (works without PHP GD extension).
     */
    protected function createFakeImage(string $name = 'test.jpg'): UploadedFile
    {
        $jpegBinary = (string) base64_decode('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=');

        return UploadedFile::fake()->createWithContent($name, $jpegBinary);
    }

    /**
     * Test default storage disk is configured as public in local/test environment.
     */
    public function test_default_storage_disk_is_public(): void
    {
        $this->assertEquals('public', Config::get('filesystems.property_images_disk'));
        $this->assertEquals('public', $this->imageService->getStorageDisk());
    }

    /**
     * Test image service resolves dynamically configured storage disk.
     */
    public function test_service_resolves_configured_storage_disk(): void
    {
        Config::set('filesystems.property_images_disk', 's3');
        $this->assertEquals('s3', $this->imageService->getStorageDisk());

        Config::set('filesystems.property_images_disk', 'public');
        $this->assertEquals('public', $this->imageService->getStorageDisk());
    }

    /**
     * Test single image upload stores to the configured public disk by default.
     */
    public function test_upload_single_image_stores_to_public_disk_by_default(): void
    {
        Storage::fake('public');
        Config::set('filesystems.property_images_disk', 'public');

        $file = $this->createFakeImage('living_room.jpg');

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->landlordToken)
            ->postJson("/api/v1/landlord/properties/{$this->property->id}/images", [
                'image' => $file,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.isFeatured', true)
            ->assertJsonPath('data.displayOrder', 1);

        $image = PropertyImage::where('property_id', $this->property->id)->first();
        $this->assertInstanceOf(PropertyImage::class, $image);

        $imageUrl = (string) $image->getAttribute('image_url');
        $path = $this->imageService->extractDiskPath($imageUrl, (string) $this->property->id);
        $this->assertNotNull($path);
        $this->disk('public')->assertExists($path);
    }

    /**
     * Test single image upload stores to configured s3 disk when configured.
     */
    public function test_upload_single_image_stores_to_configured_s3_disk(): void
    {
        Storage::fake('s3');
        Config::set('filesystems.property_images_disk', 's3');

        $file = $this->createFakeImage('bedroom.jpg');

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->landlordToken)
            ->postJson("/api/v1/landlord/properties/{$this->property->id}/images", [
                'image' => $file,
            ]);

        $response->assertStatus(201);

        $image = PropertyImage::where('property_id', $this->property->id)->first();
        $this->assertInstanceOf(PropertyImage::class, $image);

        $imageUrl = (string) $image->getAttribute('image_url');
        $path = $this->imageService->extractDiskPath($imageUrl, (string) $this->property->id);
        $this->assertNotNull($path);
        $this->disk('s3')->assertExists($path);
    }

    /**
     * Test deleting an image removes file asset from configured public disk.
     */
    public function test_delete_image_removes_file_from_public_disk(): void
    {
        Storage::fake('public');
        Config::set('filesystems.property_images_disk', 'public');

        // Upload two images so deleting one satisfies min-1 invariant
        $file1 = $this->createFakeImage('balcony.jpg');
        $file2 = $this->createFakeImage('kitchen.jpg');

        $image1 = $this->imageService->uploadSingleImage($this->property, $this->landlord, $file1);
        $image2 = $this->imageService->uploadSingleImage($this->property, $this->landlord, $file2);

        $path1 = $this->imageService->extractDiskPath($image1->image_url, (string) $this->property->id);
        $path2 = $this->imageService->extractDiskPath($image2->image_url, (string) $this->property->id);

        $this->assertNotNull($path1);
        $this->assertNotNull($path2);
        $this->disk('public')->assertExists($path1);
        $this->disk('public')->assertExists($path2);

        // Delete first image
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->landlordToken)
            ->deleteJson("/api/v1/landlord/properties/{$this->property->id}/images/{$image1->id}");

        $response->assertNoContent();

        // Asset deleted from disk
        $this->disk('public')->assertMissing($path1);
        $this->disk('public')->assertExists($path2);

        // Second image promoted to featured
        $remainingImage = PropertyImage::where('property_id', $this->property->id)->first();
        $this->assertInstanceOf(PropertyImage::class, $remainingImage);
        $this->assertEquals($image2->getKey(), $remainingImage->getKey());
        $this->assertTrue((bool) $remainingImage->getAttribute('is_featured'));
    }

    /**
     * Test deleting an image removes file asset from configured s3 disk.
     */
    public function test_delete_image_removes_file_from_s3_disk(): void
    {
        Storage::fake('s3');
        Config::set('filesystems.property_images_disk', 's3');

        $file1 = $this->createFakeImage('dining.jpg');
        $file2 = $this->createFakeImage('washroom.jpg');

        $image1 = $this->imageService->uploadSingleImage($this->property, $this->landlord, $file1);
        $image2 = $this->imageService->uploadSingleImage($this->property, $this->landlord, $file2);

        $path1 = $this->imageService->extractDiskPath($image1->image_url, (string) $this->property->id);
        $path2 = $this->imageService->extractDiskPath($image2->image_url, (string) $this->property->id);

        $this->assertNotNull($path1);
        $this->assertNotNull($path2);
        $this->disk('s3')->assertExists($path1);
        $this->disk('s3')->assertExists($path2);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->landlordToken)
            ->deleteJson("/api/v1/landlord/properties/{$this->property->id}/images/{$image1->id}");

        $response->assertNoContent();

        $this->disk('s3')->assertMissing($path1);
        $this->disk('s3')->assertExists($path2);
    }

    /**
     * Test extractDiskPath extracts correct relative disk path across various URL schemes.
     */
    public function test_extract_disk_path_handles_multiple_url_schemes(): void
    {
        $propertyId = (string) $this->property->id;

        // Local storage URL format
        $localUrl = "http://localhost:8000/storage/properties/{$propertyId}/test-uuid.jpg";
        $this->assertEquals("properties/{$propertyId}/test-uuid.jpg", $this->imageService->extractDiskPath($localUrl, $propertyId));

        // Relative local path format
        $relativeUrl = "/storage/properties/{$propertyId}/test-uuid.webp";
        $this->assertEquals("properties/{$propertyId}/test-uuid.webp", $this->imageService->extractDiskPath($relativeUrl, $propertyId));

        // Direct S3 / Cloudflare R2 bucket URL format
        $s3Url = "https://thikana-bucket.s3.us-east-1.amazonaws.com/properties/{$propertyId}/test-uuid.png";
        $this->assertEquals("properties/{$propertyId}/test-uuid.png", $this->imageService->extractDiskPath($s3Url, $propertyId));

        // Custom domain CDN URL with query parameters
        $cdnUrl = "https://images.thikanabd.com/properties/{$propertyId}/test-uuid.jpg?X-Amz-Signature=xyz123";
        $this->assertEquals("properties/{$propertyId}/test-uuid.jpg", $this->imageService->extractDiskPath($cdnUrl, $propertyId));

        // External third-party photo (e.g. Unsplash) should return null (not managed on disk)
        $externalUrl = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267";
        $this->assertNull($this->imageService->extractDiskPath($externalUrl, $propertyId));
    }

    /**
     * Test upload failure rollback cleans up orphaned file from the configured disk.
     */
    public function test_upload_rollback_cleans_up_orphaned_file_on_configured_disk(): void
    {
        Storage::fake('s3');
        Config::set('filesystems.property_images_disk', 's3');

        $file = $this->createFakeImage('corrupted_attempt.jpg');

        // Hook into model saving event to simulate unexpected database write failure
        \App\Models\PropertyImage::saving(function () {
            throw new \RuntimeException('Simulated database write failure during image record creation');
        });

        try {
            $this->imageService->uploadSingleImage($this->property, $this->landlord, $file);
            $this->fail('Expected RuntimeException was not thrown');
        } catch (\RuntimeException $e) {
            $this->assertEquals('Simulated database write failure during image record creation', $e->getMessage());
        }

        // Assert no orphaned files remain in storage directory on s3
        $remainingFiles = Storage::disk('s3')->allFiles("properties/{$this->property->id}");
        $this->assertEmpty($remainingFiles, 'Orphaned image was not cleaned up after transaction rollback');

        // Assert database has 0 images
        $this->assertEquals(0, $this->property->images()->count());
    }

    /**
     * Test DEF-C1-01: Deleting a legacy public disk image purges from public disk even when S3 is configured.
     */
    public function test_deleting_legacy_public_image_purges_from_public_disk_even_when_s3_configured(): void
    {
        Storage::fake('public');
        Storage::fake('s3');

        $propId = (string) $this->property->id;
        $legacyPath1 = "properties/{$propId}/legacy_01.jpg";
        $legacyPath2 = "properties/{$propId}/legacy_02.jpg";

        // Seed legacy files on public storage disk
        Storage::disk('public')->put($legacyPath1, 'legacy-binary-1');
        Storage::disk('public')->put($legacyPath2, 'legacy-binary-2');

        $img1 = $this->property->images()->create([
            'image_url' => "http://localhost:8000/storage/{$legacyPath1}",
            'is_featured' => true,
            'display_order' => 1,
        ]);
        $img2 = $this->property->images()->create([
            'image_url' => "/storage/{$legacyPath2}",
            'is_featured' => false,
            'display_order' => 2,
        ]);

        $this->disk('public')->assertExists($legacyPath1);
        $this->disk('public')->assertExists($legacyPath2);

        // Environment switches to S3 (e.g. Render production cutover)
        Config::set('filesystems.property_images_disk', 's3');

        // Landlord deletes legacy image 1
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->landlordToken)
            ->deleteJson("/api/v1/landlord/properties/{$this->property->id}/images/{$img1->id}");

        $response->assertNoContent();

        // Must be purged from public disk, not S3
        $this->disk('public')->assertMissing($legacyPath1);
        $this->disk('public')->assertExists($legacyPath2);
        $this->disk('s3')->assertMissing($legacyPath1);

        // Database record deleted and remaining image promoted
        $this->assertDatabaseMissing('property_images', ['id' => $img1->id]);
        $remaining = PropertyImage::where('property_id', $this->property->id)->first();
        $this->assertInstanceOf(PropertyImage::class, $remaining);
        $this->assertEquals($img2->getKey(), $remaining->getKey());
        $this->assertTrue((bool) $remaining->getAttribute('is_featured'));
    }

    /**
     * Test deleting an image with an external URL does not trigger disk deletion or error.
     */
    public function test_external_url_image_deletion_does_not_trigger_disk_deletion(): void
    {
        Storage::fake('public');
        Storage::fake('s3');

        $img1 = $this->property->images()->create([
            'image_url' => 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
            'is_featured' => true,
            'display_order' => 1,
        ]);
        $img2 = $this->property->images()->create([
            'image_url' => 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
            'is_featured' => false,
            'display_order' => 2,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->landlordToken)
            ->deleteJson("/api/v1/landlord/properties/{$this->property->id}/images/{$img1->id}");

        $response->assertNoContent();

        $this->assertDatabaseMissing('property_images', ['id' => $img1->id]);
        $this->assertDatabaseHas('property_images', ['id' => $img2->id]);
    }

    /**
     * Test custom CDN URL resolves to S3 disk and deletes safely.
     */
    public function test_custom_cdn_url_resolves_and_deletes_from_s3_disk(): void
    {
        Storage::fake('s3');
        Config::set('filesystems.property_images_disk', 's3');
        Config::set('filesystems.disks.s3.url', 'https://images.thikanabd.com');

        $propId = (string) $this->property->id;
        $cdnPath1 = "properties/{$propId}/cdn_01.webp";
        $cdnPath2 = "properties/{$propId}/cdn_02.webp";

        Storage::disk('s3')->put($cdnPath1, 'cdn-binary-1');
        Storage::disk('s3')->put($cdnPath2, 'cdn-binary-2');

        $img1 = $this->property->images()->create([
            'image_url' => "https://images.thikanabd.com/{$cdnPath1}",
            'is_featured' => true,
            'display_order' => 1,
        ]);
        $img2 = $this->property->images()->create([
            'image_url' => "https://images.thikanabd.com/{$cdnPath2}?v=production",
            'is_featured' => false,
            'display_order' => 2,
        ]);

        $this->disk('s3')->assertExists($cdnPath1);
        $this->disk('s3')->assertExists($cdnPath2);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->landlordToken)
            ->deleteJson("/api/v1/landlord/properties/{$this->property->id}/images/{$img1->id}");

        $response->assertNoContent();

        $this->disk('s3')->assertMissing($cdnPath1);
        $this->disk('s3')->assertExists($cdnPath2);
    }

    /**
     * Test DEF-C1-02: extractDiskPath rejects mismatched property ID.
     */
    public function test_extract_disk_path_rejects_mismatched_property_id(): void
    {
        $currentPropId = (string) $this->property->id;
        $mismatchedUrl = 'http://localhost:8000/storage/properties/99999/photo.jpg';

        $this->assertNull($this->imageService->extractDiskPath($mismatchedUrl, $currentPropId));
    }

    /**
     * Test DEF-C1-02: extractDiskPath rejects unscoped storage paths.
     */
    public function test_extract_disk_path_rejects_unscoped_storage_path(): void
    {
        $propId = (string) $this->property->id;

        $this->assertNull($this->imageService->extractDiskPath('/storage/avatars/user.jpg', $propId));
        $this->assertNull($this->imageService->extractDiskPath('http://localhost:8000/storage/contracts/doc.pdf', $propId));
        $this->assertNull($this->imageService->extractDiskPath('/storage/properties/', $propId));
    }

    /**
     * Test DEF-C1-02: extractDiskPath rejects path traversal sequences.
     */
    public function test_extract_disk_path_rejects_path_traversal(): void
    {
        $propId = (string) $this->property->id;

        $this->assertNull($this->imageService->extractDiskPath("/storage/properties/{$propId}/../../etc/passwd", $propId));
        $this->assertNull($this->imageService->extractDiskPath("properties/{$propId}/../sibling/file.jpg", $propId));
        $this->assertNull($this->imageService->extractDiskPath("properties/{$propId}/./nested/file.jpg", $propId));
    }

    /**
     * Test resolveDiskForUrl rejects arbitrary external domains that contain storage substrings.
     */
    public function test_resolve_disk_for_url_rejects_arbitrary_urls_with_storage_substring(): void
    {
        $propId = (string) $this->property->id;
        $untrustedUrl = "https://untrusted-external-domain.com/storage/properties/{$propId}/test.jpg";

        $this->assertNull($this->imageService->resolveDiskForUrl($untrustedUrl, $propId));
    }
}
