<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Respondent extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'name',
        'email',
        'ip_address',
        'submitted_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];

    /**
     * Get the event that owns the respondent.
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get the answers for the respondent.
     */
    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class);
    }
}
