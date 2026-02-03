<?php

namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\Event;
use App\Models\Respondent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class FormController extends Controller
{
    /**
     * Display the public form.
     */
    public function show(string $slug): Response|RedirectResponse
    {
        $event = Event::with(['questions' => function ($query) {
            $query->orderBy('sort_order');
        }])->where('slug', $slug)->first();

        if (!$event) {
            abort(404);
        }

        // Check if form is closed
        if ($event->status === 'closed') {
            return Inertia::render('Public/Closed', [
                'event' => [
                    'title' => $event->title,
                    'logo_image' => $event->logo_image ? Storage::url($event->logo_image) : null,
                ],
            ]);
        }

        // Check if form is draft (not published)
        // Allow admin users to preview draft forms
        if ($event->status === 'draft' && !auth()->check()) {
            abort(404);
        }

        // Send both languages so user can switch
        $questions = $event->questions->map(function ($question) {
            return [
                'id' => $question->id,
                'text_id' => $question->question_text,
                'text_en' => $question->question_text_en ?: $question->question_text,
                'type' => $question->type,
                'is_required' => $question->is_required,
                'options' => $question->options,
            ];
        });

        return Inertia::render('Public/Form', [
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'default_locale' => $event->locale,
                'banner_image' => $event->banner_image ? Storage::url($event->banner_image) : null,
                'logo_image' => $event->logo_image ? Storage::url($event->logo_image) : null,
                'theme_config' => $event->theme_config,
            ],
            'questions' => $questions,
        ]);
    }

    /**
     * Store a new form submission.
     */
    public function submit(Request $request, string $slug): RedirectResponse
    {
        $event = Event::with('questions')
            ->where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        // Build validation rules dynamically
        $rules = [
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'answers' => 'required|array',
        ];

        foreach ($event->questions as $question) {
            $key = "answers.{$question->id}";
            
            if ($question->is_required) {
                $rules[$key] = match ($question->type) {
                    'rating' => 'required|integer|min:1|max:5',
                    'file' => 'required|file|max:2048|mimes:jpg,jpeg,png,gif,pdf',
                    'multiple_choice' => 'required|string',
                    default => 'required|string',
                };
            } else {
                $rules[$key] = match ($question->type) {
                    'rating' => 'nullable|integer|min:1|max:5',
                    'file' => 'nullable|file|max:2048|mimes:jpg,jpeg,png,gif,pdf',
                    default => 'nullable|string',
                };
            }
        }

        $validated = $request->validate($rules);

        // Create respondent
        $respondent = Respondent::create([
            'event_id' => $event->id,
            'name' => $validated['name'] ?? null,
            'email' => $validated['email'] ?? null,
            'ip_address' => $request->ip(),
        ]);

        // Store answers
        foreach ($event->questions as $question) {
            $answerValue = $validated['answers'][$question->id] ?? null;

            if ($answerValue === null) {
                continue;
            }

            $answerData = [
                'respondent_id' => $respondent->id,
                'form_question_id' => $question->id,
            ];

            if ($question->type === 'rating') {
                $answerData['answer_numeric'] = (int) $answerValue;
            } elseif ($question->type === 'file' && $request->hasFile("answers.{$question->id}")) {
                $path = $request->file("answers.{$question->id}")->store('uploads', 'public');
                $answerData['file_path'] = $path;
            } else {
                $answerData['answer_text'] = $answerValue;
            }

            Answer::create($answerData);
        }

        return redirect()->route('form.thankyou', $slug);
    }

    /**
     * Display thank you page.
     */
    public function thankyou(string $slug): Response
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        return Inertia::render('Public/ThankYou', [
            'event' => [
                'title' => $event->title,
                'logo_image' => $event->logo_image ? Storage::url($event->logo_image) : null,
            ],
        ]);
    }
}
