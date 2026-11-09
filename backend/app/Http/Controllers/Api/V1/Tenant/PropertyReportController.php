<?php

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePropertyReportRequest;
use App\Http\Resources\PropertyReportResource;
use App\Models\Property;
use App\Models\PropertyReport;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PropertyReportController extends Controller
{
    /**
     * Submit a report for a property listing.
     */
    public function store(StorePropertyReportRequest $request, string|int $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $property = Property::where('id', $id)
            ->orWhere('slug', $id)
            ->firstOrFail();

        $report = DB::transaction(function () use ($user, $property, $request) {
            // Lock parent user record to serialize concurrent submissions
            User::where('id', $user->id)->lockForUpdate()->first();

            $hasPending = PropertyReport::where('property_id', $property->id)
                ->where('reporter_id', $user->id)
                ->where('status', 'pending')
                ->lockForUpdate()
                ->exists();

            if ($hasPending) {
                throw ValidationException::withMessages([
                    'report' => ['You already have a pending report for this property.'],
                ]);
            }

            return PropertyReport::create([
                'property_id' => $property->id,
                'reporter_id' => $user->id,
                'reason' => (string) $request->input('reason'),
                'details' => $request->input('details'),
                'status' => 'pending',
            ]);
        });

        $report->load(['property', 'reporter']);

        return response()->json([
            'success' => true,
            'data' => new PropertyReportResource($report),
            'message' => 'Property report submitted successfully.',
        ], 201);
    }
}

