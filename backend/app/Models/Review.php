<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $property_id
 * @property int $tenant_id
 * @property string $overall_rating
 * @property int $accuracy_rating
 * @property int $landlord_behavior_rating
 * @property int $location_rating
 * @property int $overall_experience_rating
 * @property string $comment
 * @property bool $visited_verified
 * @property string $status
 * @property string|null $admin_notes
 * @property int|null $moderated_by
 * @property \Illuminate\Support\Carbon|null $moderated_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Property $property
 * @property-read User $tenant
 * @property-read User|null $moderator
 */
class Review extends Model
{
    protected $table = 'reviews';

    protected $fillable = [
        'property_id',
        'tenant_id',
        'overall_rating',
        'accuracy_rating',
        'landlord_behavior_rating',
        'location_rating',
        'overall_experience_rating',
        'comment',
        'visited_verified',
        'status',
        'admin_notes',
        'moderated_by',
        'moderated_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'overall_rating' => 'decimal:2',
            'accuracy_rating' => 'integer',
            'landlord_behavior_rating' => 'integer',
            'location_rating' => 'integer',
            'overall_experience_rating' => 'integer',
            'visited_verified' => 'boolean',
            'moderated_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Property, $this>
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tenant_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function moderator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'moderated_by');
    }

    /**
     * @param Builder<Review> $query
     * @return Builder<Review>
     */
    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', 'approved');
    }

    /**
     * @param Builder<Review> $query
     * @return Builder<Review>
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }
}
