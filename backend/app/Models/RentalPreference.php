<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int|null $preferred_area_id
 * @property float|null $max_budget
 * @property string|null $preferred_property_type
 * @property int|null $min_rooms
 * @property int|null $min_bathrooms
 * @property string|null $preferred_furnished
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 * @property-read Area|null $preferredArea
 * @property-read Collection<int, Amenity> $amenities
 */
#[Fillable([
    'user_id',
    'preferred_area_id',
    'max_budget',
    'preferred_property_type',
    'min_rooms',
    'min_bathrooms',
    'preferred_furnished',
])]
class RentalPreference extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'preferred_area_id' => 'integer',
            'max_budget' => 'float',
            'min_rooms' => 'integer',
            'min_bathrooms' => 'integer',
        ];
    }

    /**
     * The tenant user owning this preference profile.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The preferred geographical area in Khulna.
     *
     * @return BelongsTo<Area, $this>
     */
    public function preferredArea(): BelongsTo
    {
        return $this->belongsTo(Area::class, 'preferred_area_id');
    }

    /**
     * Required amenities chosen by the tenant.
     *
     * @return BelongsToMany<Amenity, $this>
     */
    public function amenities(): BelongsToMany
    {
        return $this->belongsToMany(
            Amenity::class,
            'rental_preference_amenities',
            'rental_preference_id',
            'amenity_id'
        )->withTimestamps();
    }

    /**
     * Determine if this preference profile has at least one configured dimension.
     */
    public function hasMeaningfulPreferences(): bool
    {
        return $this->preferred_area_id !== null
            || ($this->max_budget !== null && $this->max_budget > 0)
            || ($this->preferred_property_type !== null && $this->preferred_property_type !== '' && $this->preferred_property_type !== 'Any')
            || ($this->min_rooms !== null && $this->min_rooms > 0)
            || ($this->min_bathrooms !== null && $this->min_bathrooms > 0)
            || ($this->relationLoaded('amenities') && $this->amenities->isNotEmpty());
    }
}

