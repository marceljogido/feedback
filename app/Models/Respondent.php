<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Respondent extends Model
{
    use HasFactory;

    protected $fillable = [
        'form_id',
        'name',
        'email',
        'custom_fields',
        'ip_address',
        'submitted_at',
        'edit_token',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'custom_fields' => 'array',
    ];

    /**
     * Get the form that owns the respondent.
     */
    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }

    /**
     * Get the event through the form.
     */
    public function event(): BelongsTo
    {
        return $this->form->event();
    }

    /**
     * Get the answers for the respondent.
     */
    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class);
    }

    /**
     * Get the spin result for the respondent.
     */
    public function spinResult(): HasOne
    {
        return $this->hasOne(SpinResult::class);
    }
}
