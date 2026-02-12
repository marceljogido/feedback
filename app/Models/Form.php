<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Form extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'name',
        'slug',
        'description',
        'status',
        'collect_name',
        'collect_email',
        'name_label',
        'email_label',
        'respondent_fields',
        'banner_image',
        'logo_image',
        'title',
        'opens_at',
        'closes_at',
        'allow_edit',
        'thank_you_title',
        'thank_you_message',
        'thank_you_button_text',
        'thank_you_button_url',
        'response_limit',
    ];

    protected $casts = [
        'collect_name' => 'boolean',
        'collect_email' => 'boolean',
        'respondent_fields' => 'array',
        'opens_at' => 'datetime',
        'closes_at' => 'datetime',
        'allow_edit' => 'boolean',
        'response_limit' => 'integer',
    ];

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($form) {
            if (empty($form->slug)) {
                $form->slug = Str::slug($form->name) . '-' . Str::lower(Str::random(6));
            }
        });
    }

    /**
     * Get the event that owns the form.
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get the questions for the form.
     */
    public function questions(): HasMany
    {
        return $this->hasMany(FormQuestion::class)->orderBy('sort_order');
    }

    /**
     * Get the respondents for the form.
     */
    public function respondents(): HasMany
    {
        return $this->hasMany(Respondent::class);
    }

    /**
     * Get the average rating for the form.
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
     * Get response count for the form.
     */
    public function getResponseCountAttribute(): int
    {
        return $this->respondents()->count();
    }

    /**
     * Check if form is active.
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
