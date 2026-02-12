<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
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
     * Get the forms for the event.
     */
    public function forms(): HasMany
    {
        return $this->hasMany(Form::class);
    }

    /**
     * Get all respondents through forms.
     */
    public function respondents(): HasManyThrough
    {
        return $this->hasManyThrough(Respondent::class, Form::class);
    }

    /**
     * Get the average rating for all forms in the event.
     */
    public function getAverageRatingAttribute(): ?float
    {
        $formIds = $this->forms()->pluck('id');
        
        if ($formIds->isEmpty()) {
            return null;
        }

        $ratingQuestions = FormQuestion::whereIn('form_id', $formIds)
            ->where('type', 'rating')
            ->pluck('id');
        
        if ($ratingQuestions->isEmpty()) {
            return null;
        }

        return Answer::whereIn('form_question_id', $ratingQuestions)
            ->whereNotNull('answer_numeric')
            ->avg('answer_numeric');
    }

    /**
     * Get total response count for all forms in the event.
     */
    public function getResponseCountAttribute(): int
    {
        return $this->respondents()->count();
    }

    /**
     * Get form count for the event.
     */
    public function getFormCountAttribute(): int
    {
        return $this->forms()->count();
    }

    /**
     * Check if event is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
