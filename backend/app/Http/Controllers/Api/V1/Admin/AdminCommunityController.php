<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateCommunityRequest;
use App\Models\Area;
use App\Models\AuditLog;
use App\Models\CommunityInformation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminCommunityController extends Controller
{
    /**
     * Default list of recognized Khulna areas.
     */
    protected const DEFAULT_AREAS = [
        'Boyra',
        'Sonadanga',
        'Khalishpur',
        'Daulatpur',
        'KUET Gate / Teligati',
        'Gollamari / Khulna University',
        'Shibbari Mor',
        'Mujgunni',
        'Choto Boyra',
        'Nirala',
    ];

    /**
     * Retrieve community intelligence mapped by area name.
     */
    public function index(): JsonResponse
    {
        $areas = Area::with('communityInformation')->get()->keyBy('name');

        $result = [];
        $allAreaNames = array_unique(array_merge(self::DEFAULT_AREAS, $areas->keys()->all()));

        foreach ($allAreaNames as $areaName) {
            $info = $areas->has($areaName) ? $areas[$areaName]->communityInformation : null;

            $result[$areaName] = [
                'transport' => $info?->transport ?? '',
                'waterlogging' => $info?->waterlogging ?? '',
                'internet' => $info?->internet ?? '',
                'noise' => $info?->noise ?? '',
                'safety' => $info?->safety ?? '',
                'general' => $info?->general ?? '',
            ];
        }

        return response()->json([
            'data' => $result,
        ]);
    }

    /**
     * Update community intelligence for a specific area and record an audit log.
     */
    public function update(UpdateCommunityRequest $request, string $areaName): JsonResponse
    {
        $areaName = urldecode($areaName);
        $currentUser = $request->user();

        $info = DB::transaction(function () use ($areaName, $request, $currentUser) {
            $area = Area::firstOrCreate(
                ['name' => $areaName],
                [
                    'division' => 'Khulna',
                    'district' => 'Khulna',
                    'city' => 'Khulna',
                ]
            );

            $communityInfo = CommunityInformation::updateOrCreate(
                ['area_id' => $area->id],
                array_merge($request->validated(), [
                    'updated_by' => $currentUser->id,
                ])
            );

            AuditLog::logAction(
                $currentUser,
                'COMMUNITY_DATA_UPDATED',
                'community',
                $areaName,
                "Updated community notes for {$areaName}."
            );

            return $communityInfo;
        });

        return response()->json([
            'message' => 'Community data updated successfully.',
            'data' => [
                'area' => $areaName,
                'transport' => $info->transport ?? '',
                'waterlogging' => $info->waterlogging ?? '',
                'internet' => $info->internet ?? '',
                'noise' => $info->noise ?? '',
                'safety' => $info->safety ?? '',
                'general' => $info->general ?? '',
            ],
        ]);
    }
}

