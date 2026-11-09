<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property int $id
 * @property int|null $role_id
 * @property string $name
 * @property string $email
 * @property string|null $phone
 * @property string|null $avatar_url
 * @property string $status
 * @property Carbon|null $email_verified_at
 * @property Carbon|null $phone_verified_at
 * @property string $password
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Role|null $role
 * @property-read RentalPreference|null $rentalPreference
 */
#[Fillable(['name', 'email', 'phone', 'avatar_url', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function hasRole(string $slug): bool
    {
        return $this->role?->slug === $slug;
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }

    public function tenantContactRequests(): HasMany
    {
        return $this->hasMany(ContactRequest::class, 'tenant_id');
    }

    public function landlordContactRequests(): HasMany
    {
        return $this->hasMany(ContactRequest::class, 'landlord_id');
    }

    public function tenantVisitRequests(): HasMany
    {
        return $this->hasMany(VisitRequest::class, 'tenant_id');
    }

    public function landlordVisitRequests(): HasMany
    {
        return $this->hasMany(VisitRequest::class, 'landlord_id');
    }

    /**
     * Properties listed by this user as a landlord.
     *
     * @return HasMany<Property, $this>
     */
    public function properties(): HasMany
    {
        return $this->hasMany(Property::class, 'landlord_id');
    }

    /**
     * Tenant's rental preferences profile.
     *
     * @return HasOne<RentalPreference, $this>
     */
    public function rentalPreference(): HasOne
    {
        return $this->hasOne(RentalPreference::class);
    }

    /**
     * @return HasMany<Favorite, $this>
     */
    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    /**
     * @return BelongsToMany<Property, $this>
     */
    public function favoriteProperties(): BelongsToMany
    {
        return $this->belongsToMany(Property::class, 'favorites', 'user_id', 'property_id')
            ->withTimestamps();
    }

    /**
     * @return HasMany<PropertyComparison, $this>
     */
    public function comparisons(): HasMany
    {
        return $this->hasMany(PropertyComparison::class)->orderBy('display_order');
    }

    /**
     * @return HasMany<Review, $this>
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'tenant_id');
    }

    /**
     * Reports filed by this user.
     *
     * @return HasMany<PropertyReport, $this>
     */
    public function reports(): HasMany
    {
        return $this->hasMany(PropertyReport::class, 'reporter_id');
    }
}
