<?php

namespace App\Services;

use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ImageManagementService
{
    /**
     * Maximum allowed photos per property.
     */
    public const MAX_IMAGES = 5;

    /**
     * Minimum required photos per property.
     */
    public const MIN_IMAGES = 1;

    /**
     * Get the configured storage disk for property images.
     */
    public function getStorageDisk(): string
    {
        return (string) config('filesystems.property_images_disk', 'public');
    }

    /**
     * Get the concrete filesystem adapter for property images with strict typing for IDEs.
     */
    protected function disk(?string $name = null): FilesystemAdapter
    {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk($name ?? $this->getStorageDisk());

        return $disk;
    }

    /**
     * Add multiple image URLs to a property.
     *
     * @param array<int, string> $imageUrls
     * @return Collection<int, PropertyImage>
     */
    public function addImageUrls(Property $property, User $user, array $imageUrls, ?string $featuredUrl = null): Collection
    {
        return DB::transaction(function () use ($property, $user, $imageUrls, $featuredUrl) {
            /** @var Property $lockedProperty */
            $lockedProperty = Property::where('id', $property->id)->lockForUpdate()->firstOrFail();

            $this->authorizeOwnerOrAdmin($lockedProperty, $user);

            $currentCount = $lockedProperty->images()->count();
            $incomingCount = count($imageUrls);

            if ($currentCount + $incomingCount > self::MAX_IMAGES) {
                throw ValidationException::withMessages([
                    'images' => ["Maximum " . self::MAX_IMAGES . " photos allowed. Current: {$currentCount}, incoming: {$incomingCount}."],
                ]);
            }

            $created = new Collection();
            $hasFeatured = $lockedProperty->images()->where('is_featured', true)->exists();

            foreach ($imageUrls as $index => $url) {
                $order = $currentCount + $index + 1;
                $isFeatured = (!$hasFeatured && $index === 0) || ($featuredUrl !== null && $url === $featuredUrl);

                $image = $lockedProperty->images()->create([
                    'image_url' => $url,
                    'is_featured' => $isFeatured,
                    'display_order' => $order,
                ]);

                if ($isFeatured) {
                    $hasFeatured = true;
                }

                $created->push($image);
            }

            // Ensure at least one image is featured if images exist
            $this->ensureFeaturedImage($lockedProperty);

            return $created;
        });
    }

    /**
     * Upload and store a single image file with pessimistic row locking and rollback cleanup.
     */
    public function uploadSingleImage(Property $property, User $user, UploadedFile $file): PropertyImage
    {
        $storedDiskPath = null;

        try {
            return DB::transaction(function () use ($property, $user, $file, &$storedDiskPath) {
                /** @var Property $lockedProperty */
                $lockedProperty = Property::where('id', $property->id)->lockForUpdate()->firstOrFail();

                $this->authorizeOwnerOrAdmin($lockedProperty, $user);

                $currentCount = $lockedProperty->images()->count();
                if ($currentCount >= self::MAX_IMAGES) {
                    throw ValidationException::withMessages([
                        'image' => ["Maximum " . self::MAX_IMAGES . " photos allowed."],
                    ]);
                }

                // Store file to configured storage disk
                $disk = $this->getStorageDisk();
                $storedDiskPath = $file->store("properties/{$lockedProperty->id}", $disk);
                $publicUrl = $this->disk($disk)->url($storedDiskPath);

                $hasFeatured = $lockedProperty->images()->where('is_featured', true)->exists();
                $isFeatured = !$hasFeatured || $currentCount === 0;

                /** @var PropertyImage $image */
                $image = $lockedProperty->images()->create([
                    'image_url' => $publicUrl,
                    'is_featured' => $isFeatured,
                    'display_order' => $currentCount + 1,
                ]);

                $this->ensureFeaturedImage($lockedProperty);

                return $image;
            });
        } catch (\Throwable $e) {
            // Failure-safe cleanup: purge uploaded file if transaction rolled back
            if ($storedDiskPath !== null) {
                try {
                    $disk = $this->getStorageDisk();
                    $this->disk($disk)->delete($storedDiskPath);
                } catch (\Throwable $storageError) {
                    Log::warning("Orphan image file cleanup failed: {$storedDiskPath}", [
                        'error' => $storageError->getMessage(),
                    ]);
                }
            }
            throw $e;
        }
    }

    /**
     * Delete an image with invariant checks, auto-promotion of featured image, and contiguous ordering.
     */
    public function deleteImage(Property $property, User $user, int $imageId): void
    {
        $diskPathToDelete = null;
        $targetDisk = null;

        DB::transaction(function () use ($property, $user, $imageId, &$diskPathToDelete, &$targetDisk) {
            /** @var Property $lockedProperty */
            $lockedProperty = Property::where('id', $property->id)->lockForUpdate()->firstOrFail();

            $this->authorizeOwnerOrAdmin($lockedProperty, $user);

            $currentCount = $lockedProperty->images()->count();
            if ($currentCount <= self::MIN_IMAGES) {
                throw ValidationException::withMessages([
                    'image' => ["A property must have at least " . self::MIN_IMAGES . " photo. Deleting the last photo is prohibited."],
                ]);
            }

            /** @var PropertyImage $image */
            $image = $lockedProperty->images()->where('id', $imageId)->firstOrFail();

            // Check if disk file and resolve storage provenance
            $parsedPath = $this->extractDiskPath($image->image_url, (string) $lockedProperty->id);
            $resolvedDisk = $parsedPath !== null ? $this->resolveDiskForUrl($image->image_url, (string) $lockedProperty->id) : null;

            if ($parsedPath !== null && $resolvedDisk !== null) {
                $diskPathToDelete = $parsedPath;
                $targetDisk = $resolvedDisk;
            }

            $wasFeatured = (bool) $image->is_featured;
            $image->delete();

            // Renormalize display orders contiguously
            $remaining = $lockedProperty->images()->orderBy('display_order')->get();
            foreach ($remaining as $idx => $remImage) {
                $remImage->update(['display_order' => $idx + 1]);
            }

            // If the deleted image was featured, promote the first remaining image
            if ($wasFeatured && $remaining->isNotEmpty()) {
                $remaining->first()->update(['is_featured' => true]);
            }

            $this->ensureFeaturedImage($lockedProperty);
        });

        // Clean up disk asset after successful commit using resolved provenance disk
        if ($diskPathToDelete !== null && $targetDisk !== null) {
            try {
                $this->disk($targetDisk)->delete($diskPathToDelete);
            } catch (\Throwable $e) {
                Log::warning("Failed to delete storage image file from disk [{$targetDisk}]: {$diskPathToDelete}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Reorder images with deterministic validation and featured promotion.
     *
     * @param array<int, int|string> $imageIds
     */
    public function reorderImages(Property $property, User $user, array $imageIds): void
    {
        DB::transaction(function () use ($property, $user, $imageIds) {
            /** @var Property $lockedProperty */
            $lockedProperty = Property::where('id', $property->id)->lockForUpdate()->firstOrFail();

            $this->authorizeOwnerOrAdmin($lockedProperty, $user);

            $existingIds = $lockedProperty->images()->pluck('id')->map(fn ($id) => (int) $id)->all();
            $incomingIds = array_map('intval', $imageIds);

            // Invariant: incoming IDs must match existing IDs exactly
            $sortedExisting = $existingIds;
            $sortedIncoming = $incomingIds;
            sort($sortedExisting);
            sort($sortedIncoming);

            if ($sortedExisting !== $sortedIncoming) {
                throw ValidationException::withMessages([
                    'imageIds' => ['The provided image IDs do not match the existing property images.'],
                ]);
            }

            foreach ($incomingIds as $index => $id) {
                $lockedProperty->images()->where('id', $id)->update([
                    'display_order' => $index + 1,
                    'is_featured' => ($index === 0), // First image is automatically featured
                ]);
            }
        });
    }

    /**
     * Authorize that the acting user is the listing owner or administrator.
     */
    protected function authorizeOwnerOrAdmin(Property $property, User $user): void
    {
        if ($user->hasRole('admin')) {
            return;
        }

        if ($user->id !== $property->landlord_id) {
            abort(403, 'common.errors.forbidden');
        }
    }

    /**
     * Ensure exactly one featured image exists if any images exist.
     */
    protected function ensureFeaturedImage(Property $property): void
    {
        $hasFeatured = $property->images()->where('is_featured', true)->exists();
        if (!$hasFeatured) {
            $first = $property->images()->orderBy('display_order')->first();
            $first?->update(['is_featured' => true]);
        }
    }

    /**
     * Strictly extract and validate property storage disk path from URL.
     * Enforces path to match properties/{propertyId}/{filename} with no path traversal.
     */
    public function extractDiskPath(string $url, string $propertyId): ?string
    {
        $parsedPath = parse_url($url, PHP_URL_PATH);
        $pathString = is_string($parsedPath) ? $parsedPath : $url;

        // Normalize directory separators
        $normalized = str_replace('\\', '/', $pathString);

        // Security check: reject directory traversal attempts
        if (str_contains($normalized, '..') || str_contains($normalized, './')) {
            return null;
        }

        // Strict prefix matching for properties/{propertyId}/
        $expectedPrefix = "properties/{$propertyId}/";
        $pos = strpos($normalized, $expectedPrefix);
        if ($pos === false) {
            return null;
        }

        $candidatePath = substr($normalized, $pos);

        // Must match exact format: properties/{propertyId}/{filename}
        $escapedPropertyId = preg_quote($propertyId, '#');
        if (!preg_match("#^properties/{$escapedPropertyId}/[a-zA-Z0-9_\-\.]+$#", $candidatePath)) {
            return null;
        }

        // Strictly verify segment count (only properties/{propertyId}/filename allowed)
        $segments = explode('/', $candidatePath);
        if (count($segments) !== 3 || $segments[0] !== 'properties' || $segments[1] !== $propertyId || $segments[2] === '') {
            return null;
        }

        return $candidatePath;
    }

    /**
     * Safely resolve the storage disk provenance for an image URL.
     * Returns null if origin cannot be established safely (e.g. external or untrusted URLs).
     */
    public function resolveDiskForUrl(string $url, string $propertyId): ?string
    {
        $diskPath = $this->extractDiskPath($url, $propertyId);
        if ($diskPath === null) {
            return null;
        }

        $parsed = parse_url($url);
        if ($parsed === false) {
            return null;
        }

        $host = isset($parsed['host']) ? strtolower((string) $parsed['host']) : null;
        $path = $parsed['path'] ?? '';

        // 1. Check if URL matches configured S3 / Cloudflare R2 / Custom CDN
        $s3Url = config('filesystems.disks.s3.url');
        $s3CdnHost = is_string($s3Url) ? strtolower((string) parse_url($s3Url, PHP_URL_HOST)) : null;

        $s3Endpoint = config('filesystems.disks.s3.endpoint');
        $s3EndpointHost = is_string($s3Endpoint) ? strtolower((string) parse_url($s3Endpoint, PHP_URL_HOST)) : null;

        $s3Bucket = config('filesystems.disks.s3.bucket');
        $s3BucketLower = is_string($s3Bucket) ? strtolower((string) $s3Bucket) : null;

        if ($host !== null) {
            if ($s3CdnHost !== null && $host === $s3CdnHost) {
                return 's3';
            }
            if ($s3EndpointHost !== null && $host === $s3EndpointHost) {
                return 's3';
            }
            if (str_contains($host, '.s3.') || str_ends_with($host, '.amazonaws.com') || str_contains($host, '.r2.cloudflarestorage.com')) {
                return 's3';
            }
            if ($s3BucketLower !== null && $s3BucketLower !== '' && str_starts_with($host, $s3BucketLower . '.')) {
                return 's3';
            }
        }

        // 2. Check if URL matches local public disk
        $appUrl = config('app.url');
        $appHost = is_string($appUrl) ? strtolower((string) parse_url($appUrl, PHP_URL_HOST)) : null;

        $isLocalHost = ($host === null) ||
            ($appHost !== null && $host === $appHost) ||
            in_array($host, ['localhost', '127.0.0.1', '::1'], true);

        if ($isLocalHost && str_starts_with($path, "/storage/properties/{$propertyId}/")) {
            // In testing environments where Storage::fake('s3') is active, fake S3 generates /storage/ paths.
            // If the file exists on the s3 fake disk, resolve to 's3'; otherwise it is legacy 'public'.
            if (config('filesystems.property_images_disk') === 's3' && $this->disk('s3')->exists($diskPath)) {
                return 's3';
            }

            return 'public';
        }

        // 3. Untrusted or external URL (e.g. unsplash.com, arbitrary domain with /storage/):
        // Return null to prevent unintended disk deletion.
        return null;
    }

    /**
     * Extract storage disk path from local public URL if applicable.
     */
    protected function extractLocalPublicPath(string $url): ?string
    {
        $storagePrefix = '/storage/';
        $pos = strpos($url, $storagePrefix);
        if ($pos !== false) {
            return substr($url, $pos + strlen($storagePrefix));
        }
        return null;
    }
}

