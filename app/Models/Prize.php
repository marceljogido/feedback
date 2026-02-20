<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prize extends Model
{
    use HasFactory;

    protected $fillable = [
        'form_id',
        'name',
        'name_en',
        'image',
        'color',
        'probability',
        'stock',
        'won_count',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'probability' => 'decimal:2',
        'stock' => 'integer',
        'won_count' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Get the form that owns the prize.
     */
    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }

    /**
     * Get the spin results for the prize.
     */
    public function spinResults(): HasMany
    {
        return $this->hasMany(SpinResult::class);
    }

    /**
     * Check if the prize still has stock available.
     */
    public function isAvailable(): bool
    {
        if ($this->stock === 0) {
            return true; // unlimited
        }
        return $this->won_count < $this->stock;
    }

    /**
     * Scope: only available prizes (active + stock available).
     */
    public function scopeAvailable($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->where('stock', 0) // unlimited
                  ->orWhereColumn('won_count', '<', 'stock');
            });
    }
}
