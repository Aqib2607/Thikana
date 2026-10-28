<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PropertyLocation extends Model
{
    use HasFactory;

    /**
     * Canonical Khulna rental areas and verified centroids.
     */
    public const CANONICAL_AREAS = [
        'KUET Gate / Teligati' => ['lat' => 22.8997, 'lng' => 89.5028],
        'Gallamari / Zero Point (KU)' => ['lat' => 22.8021, 'lng' => 89.5358],
        'Sonadanga R/A' => ['lat' => 22.8252, 'lng' => 89.5441],
        'Boyra' => ['lat' => 22.8423, 'lng' => 89.5312],
        'Mujgunni' => ['lat' => 22.8582, 'lng' => 89.5298],
        'Nirala R/A' => ['lat' => 22.8115, 'lng' => 89.5521],
        'Khalishpur' => ['lat' => 22.8615, 'lng' => 89.5392],
        'Daulatpur (BL College)' => ['lat' => 22.8805, 'lng' => 89.5187],
        'Choto Boyra' => ['lat' => 22.8380, 'lng' => 89.5320],
        'Shibbari Mor' => ['lat' => 22.8200, 'lng' => 89.5535],
    ];

    /**
     * Regional bounding box for Khulna metropolitan area.
     */
    public const BOUNDS = [
        'min_lat' => 22.7500,
        'max_lat' => 22.9500,
        'min_lng' => 89.4500,
        'max_lng' => 89.6000,
    ];

    protected $table = 'property_locations';

    protected $fillable = [
        'property_id',
        'division',
        'district',
        'city',
        'area',
        'exact_address',
        'lat',
        'lng',
    ];

    protected function casts(): array
    {
        return [
            'lat' => 'decimal:7',
            'lng' => 'decimal:7',
        ];
    }

    /**
     * The parent property.
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    /**
     * Resolve fallback coordinates for a recognized area.
     *
     * @return array{lat: float, lng: float}|null
     */
    public static function resolveAreaCoordinates(string $areaName): ?array
    {
        return self::CANONICAL_AREAS[$areaName] ?? null;
    }

    /**
     * Verify whether given coordinates fall within the regional bounding box.
     */
    public static function isValidRegionalCoordinate(float $lat, float $lng): bool
    {
        return $lat >= self::BOUNDS['min_lat']
            && $lat <= self::BOUNDS['max_lat']
            && $lng >= self::BOUNDS['min_lng']
            && $lng <= self::BOUNDS['max_lng'];
    }
}

