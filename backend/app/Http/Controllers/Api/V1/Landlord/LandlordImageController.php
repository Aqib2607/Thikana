<?php

namespace App\Http\Controllers\Api\V1\Landlord;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReorderImagesRequest;
use App\Http\Requests\UploadImageRequest;
use App\Models\Property;
use App\Services\ImageManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class LandlordImageController extends Controller
{
    public function __construct(
        protected ImageManagementService $imageService
    ) {}

    /**
     * Add a photo to a property (upload or URL).
     */
    public function store(UploadImageRequest $request, int $id): JsonResponse
    {
        $property = Property::where('id', $id)->firstOrFail();
        Gate::authorize('update', $property);

        if ($request->hasFile('image')) {
            $image = $this->imageService->uploadSingleImage(
                $property,
                $request->user(),
                $request->file('image')
            );
        } else {
            $images = $this->imageService->addImageUrls(
                $property,
                $request->user(),
                [$request->input('imageUrl')]
            );
            $image = $images->first();
        }

        return response()->json([
            'data' => [
                'id' => (string) $image->id,
                'imageUrl' => $image->image_url,
                'isFeatured' => (bool) $image->is_featured,
                'displayOrder' => (int) $image->display_order,
            ],
        ], 201);
    }

    /**
     * Delete a photo from property gallery.
     */
    public function destroy(Request $request, int $id, int $imageId): Response
    {
        $property = Property::where('id', $id)->firstOrFail();
        Gate::authorize('update', $property);

        $this->imageService->deleteImage($property, $request->user(), $imageId);

        return response()->noContent();
    }

    /**
     * Reorder photos in gallery.
     */
    public function reorder(ReorderImagesRequest $request, int $id): JsonResponse
    {
        $property = Property::where('id', $id)->firstOrFail();
        Gate::authorize('update', $property);

        $this->imageService->reorderImages($property, $request->user(), $request->input('imageIds'));

        return response()->json([
            'status' => 200,
            'message' => 'Images reordered successfully',
        ]);
    }
}

