<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SpinResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'respondent_id',
        'prize_id',
        'phone_number',
        'status',
        'claimed_at',
    ];

    protected $casts = [
        'claimed_at' => 'datetime',
    ];

    /**
     * Boot the model — auto-generate claim code is not needed,
     * phone number is used instead.
     */

    /**
     * Get the respondent.
     */
    public function respondent(): BelongsTo
    {
        return $this->belongsTo(Respondent::class);
    }

    /**
     * Get the prize.
     */
    public function prize(): BelongsTo
    {
        return $this->belongsTo(Prize::class);
    }
}
