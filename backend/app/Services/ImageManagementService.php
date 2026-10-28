<?php

namespace App\Services;

use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
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

                // Store file to public storage disk
                $storedDiskPath = $file->store("properties/{$lockedProperty->id}", 'public');
                $publicUrl = Storage::disk('public')->url($storedDiskPath);

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
                    Storage::disk('public')->delete($storedDiskPath);
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
        $localPathToDelete = null;

        DB::transaction(function () use ($property, $user, $imageId, &$localPathToDelete) {
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

            // Check if local file to purge post-commit
            $parsedPath = $this->extractLocalPublicPath($image->image_url);
            if ($parsedPath !== null) {
                $localPathToDelete = $parsedPath;
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

        // Clean up disk asset after successful commit
        if ($localPathToDelete !== null) {
            try {
                Storage::disk('public')->delete($localPathToDelete);
            } catch (\Throwable $e) {
                Log::warning("Failed to delete public storage image file: {$localPathToDelete}", [
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

