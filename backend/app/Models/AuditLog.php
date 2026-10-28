<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'audit_logs';

    /**
     * Disable updated_at since audit logs are append-only.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'actor_id',
        'actor_name',
        'action',
        'target_type',
        'target_id',
        'details',
        'created_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * The user (administrator) who performed this action.
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * Static helper to reliably create an append-only audit record.
     */
    public static function logAction(?User $actor, string $action, string $targetType, string $targetId, string $details): self
    {
        return self::create([
            'actor_id' => $actor?->id,
            'actor_name' => $actor?->name ?? 'System Admin',
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => (string) $targetId,
            'details' => $details,
            'created_at' => now(),
        ]);
    }
}

