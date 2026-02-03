<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'question_text',
        'question_text_en',
        'type',
        'is_required',
        'options',
        'sort_order',
    ];

    protected $casts = [
        'options' => 'array',
        'is_required' => 'boolean',
    ];

    /**
     * Get the event that owns the question.
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get the answers for the question.
     */
    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class);
    }

    /**
     * Get the question text based on locale.
     */
    public function getLocalizedTextAttribute(): string
    {
        $locale = app()->getLocale();
        
        if ($locale === 'en' && !empty($this->question_text_en)) {
            return $this->question_text_en;
        }
        
        return $this->question_text;
    }
}
