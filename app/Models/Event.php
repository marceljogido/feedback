<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'slug',
        'description',
        'banner_image',
        'logo_image',
        'status',
        'locale',
        'theme_config',
        'event_date',
    ];

    protected $casts = [
        'theme_config' => 'array',
        'event_date' => 'datetime',
    ];

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($event) {
            if (empty($event->slug)) {
                $event->slug = Str::slug($event->title) . '-' . Str::lower(Str::random(6));
            }
        });
    }

    /**
     * Get the user that owns the event.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the form questions for the event.
     */
    public function questions(): HasMany
    {
        return $this->hasMany(FormQuestion::class)->orderBy('sort_order');
    }

    /**
     * Get the respondents for the event.
     */
    public function respondents(): HasMany
    {
        return $this->hasMany(Respondent::class);
    }

    /**
     * Get the average rating for the event.
     */
    public function getAverageRatingAttribute(): ?float
    {
        $ratingQuestions = $this->questions()->where('type', 'rating')->pluck('id');
        
        if ($ratingQuestions->isEmpty()) {
            return null;
        }

        return Answer::whereIn('form_question_id', $ratingQuestions)
            ->whereNotNull('answer_numeric')
            ->avg('answer_numeric');
    }

    /**
     * Get response count for the event.
     */
    public function getResponseCountAttribute(): int
    {
        return $this->respondents()->count();
    }

    /**
     * Check if event is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Get the public URL for the form.
     */
    public function getPublicUrlAttribute(): string
    {
        return route('form.show', $this->slug);
    }
}
