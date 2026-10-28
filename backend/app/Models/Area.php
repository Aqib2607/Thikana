<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Area extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'areas';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'bangla_name',
        'division',
        'district',
        'city',
        'lat',
        'lng',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'lat' => 'float',
        'lng' => 'float',
    ];

    /**
     * Community metadata associated with this area.
     */
    public function communityInformation(): HasOne
    {
        return $this->hasOne(CommunityInformation::class, 'area_id');
    }

    /**
     * Property location records situated within this area.
     */
    public function propertyLocations(): HasMany
    {
        return $this->hasMany(PropertyLocation::class, 'area', 'name');
    }
}

