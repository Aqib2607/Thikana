<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Property extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'properties';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'landlord_id',
        'title',
        'bangla_title',
        'slug',
        'property_type',
        'rental_type',
        'rent',
        'advance',
        'additional_charges',
        'bills_included',
        'availability',
        'available_from',
        'approval_status',
        'size',
        'rooms',
        'bathrooms',
        'balconies',
        'floor',
        'total_floors',
        'furnished_status',
        'preferred_tenant',
        'public_contact_visible',
        'community_info',
        'rating',
        'review_count',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'bills_included' => 'array',
            'community_info' => 'array',
            'rent' => 'decimal:2',
            'advance' => 'decimal:2',
            'additional_charges' => 'decimal:2',
            'available_from' => 'date',
            'public_contact_visible' => 'boolean',
            'rating' => 'decimal:2',
            'review_count' => 'integer',
            'size' => 'integer',
            'rooms' => 'integer',
            'bathrooms' => 'integer',
            'balconies' => 'integer',
            'total_floors' => 'integer',
        ];
    }

    /**
     * The landlord who owns this listing.
     */
    public function landlord(): BelongsTo
    {
        return $this->belongsTo(User::class, 'landlord_id');
    }

    /**
     * The 1:1 location hierarchy for this property.
     */
    public function location(): HasOne
    {
        return $this->hasOne(PropertyLocation::class);
    }

    /**
     * Ordered gallery images for this property.
     */
    public function images(): HasMany
    {
        return $this->hasMany(PropertyImage::class)->orderBy('display_order');
    }

    /**
     * Primary featured card image.
     */
    public function featuredImage(): HasOne
    {
        return $this->hasOne(PropertyImage::class)->where('is_featured', true);
    }

    /**
     * Attached amenities.
     */
    public function amenities(): BelongsToMany
    {
        return $this->belongsToMany(Amenity::class, 'property_amenities')->withTimestamps();
    }

    /**
     * Moderation verifications recorded for this property.
     */
    public function verifications(): HasMany
    {
        return $this->hasMany(PropertyVerification::class);
    }

    /**
     * Contact requests submitted for this listing.
     */
    public function contactRequests(): HasMany
    {
        return $this->hasMany(ContactRequest::class);
    }

    /**
     * Visit requests scheduled for this listing.
     */
    public function visitRequests(): HasMany
    {
        return $this->hasMany(VisitRequest::class);
    }

    /**
     * Tenant favorites recorded for this property.
     *
     * @return HasMany<Favorite, $this>
     */
    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    /**
     * Tenants who have favorited this property.
     *
     * @return BelongsToMany<User, $this>
     */
    public function favoritedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'favorites', 'property_id', 'user_id')
            ->withTimestamps();
    }

    /**
     * Comparisons including this property.
     *
     * @return HasMany<PropertyComparison, $this>
     */
    public function comparisons(): HasMany
    {
        return $this->hasMany(PropertyComparison::class);
    }

    /**
     * All reviews submitted for this property.
     *
     * @return HasMany<Review, $this>
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Approved reviews visible for public discovery.
     *
     * @return HasMany<Review, $this>
     */
    public function approvedReviews(): HasMany
    {
        return $this->hasMany(Review::class)->where('status', 'approved');
    }

    /**
     * Reports filed against this property listing.
     *
     * @return HasMany<PropertyReport, $this>
     */
    public function reports(): HasMany
    {
        return $this->hasMany(PropertyReport::class);
    }

    /**
     * Scope to only approved listings.
     */
    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('approval_status', 'Approved');
    }

    /**
     * Scope for public discovery (Approved and not Temporarily Unavailable).
     */
    public function scopeAvailableForDiscovery(Builder $query): Builder
    {
        return $query->where('approval_status', 'Approved')
            ->where('availability', '!=', 'Temporarily Unavailable');
    }

    /**
     * Helper to verify if property is approved.
     */
    public function isApproved(): bool
    {
        return $this->approval_status === 'Approved';
    }

    /**
     * Helper to generate a unique, stable slug from title.
     */
    public static function generateSlug(string $title): string
    {
        $base = Str::slug($title);
        if (empty($base)) {
            $base = 'property';
        }
        return $base . '-' . strtolower(Str::random(6));
    }
}

