<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Answer extends Model
{
    use HasFactory;

    protected $fillable = [
        'respondent_id',
        'form_question_id',
        'answer_text',
        'answer_numeric',
        'file_path',
    ];

    /**
     * Get the respondent that owns the answer.
     */
    public function respondent(): BelongsTo
    {
        return $this->belongsTo(Respondent::class);
    }

    /**
     * Get the question that this answer belongs to.
     */
    public function question(): BelongsTo
    {
        return $this->belongsTo(FormQuestion::class, 'form_question_id');
    }

    /**
     * Get the formatted answer based on question type.
     */
    public function getFormattedAnswerAttribute(): mixed
    {
        $type = $this->question?->type;

        return match ($type) {
            'rating' => $this->answer_numeric,
            'file' => $this->file_path,
            default => $this->answer_text,
        };
    }
}
