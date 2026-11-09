<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string|null $role
 * @property string $type
 * @property string $title
 * @property string $title_bn
 * @property string $message
 * @property string $message_bn
 * @property string|null $link
 * @property bool $read
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 */
class Notification extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'role',
        'type',
        'title',
        'title_bn',
        'message',
        'message_bn',
        'link',
        'read',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'read' => 'boolean',
        ];
    }

    /**
     * The recipient of this notification.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to unread notifications only.
     *
     * @param  Builder<Notification>  $query
     * @return Builder<Notification>
     */
    public function scopeUnread(Builder $query): Builder
    {
        return $query->where('read', false);
    }

    /**
     * Mark this notification as read.
     */
    public function markAsRead(): bool
    {
        return $this->update(['read' => true]);
    }
}

