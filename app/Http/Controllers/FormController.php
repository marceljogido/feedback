<?php

namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\Form;
use App\Models\Prize;
use App\Models\Respondent;
use App\Models\SpinResult;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FormController extends Controller
{
    /**
     * Display the public form.
     */
    public function show(string $slug): Response|RedirectResponse
    {
        $form = Form::with(['questions' => function ($query) {
            $query->orderBy('sort_order');
        }, 'event'])->where('slug', $slug)->first();

        if (!$form) {
            abort(404);
        }

        // Check scheduling - form not yet open
        if ($form->opens_at && now()->lt($form->opens_at)) {
            return Inertia::render('Public/Closed', [
                'event' => [
                    'title' => $form->event->title,
                    'logo_image' => $form->event->logo_image ? Storage::url($form->event->logo_image) : null,
                ],
                'form' => [
                    'name' => $form->name,
                ],
                'message' => 'Form ini belum dibuka. Akan tersedia pada ' . $form->opens_at->format('d M Y, H:i') . '.',
                'message_en' => 'This form is not yet open. It will be available on ' . $form->opens_at->format('d M Y, H:i') . '.',
            ]);
        }

        // Check scheduling - form already closed by time
        if ($form->closes_at && now()->gt($form->closes_at)) {
            return Inertia::render('Public/Closed', [
                'event' => [
                    'title' => $form->event->title,
                    'logo_image' => $form->event->logo_image ? Storage::url($form->event->logo_image) : null,
                ],
                'form' => [
                    'name' => $form->name,
                ],
                'message' => 'Form ini sudah ditutup sejak ' . $form->closes_at->format('d M Y, H:i') . '.',
                'message_en' => 'This form has been closed since ' . $form->closes_at->format('d M Y, H:i') . '.',
            ]);
        }

        // Check if form is closed (manual)
        if ($form->status === 'closed') {
            return Inertia::render('Public/Closed', [
                'event' => [
                    'title' => $form->event->title,
                    'logo_image' => $form->event->logo_image ? Storage::url($form->event->logo_image) : null,
                ],
                'form' => [
                    'name' => $form->name,
                ],
            ]);
        }

        // Check if form is draft (not published)
        // Allow admin users to preview draft forms
        if ($form->status === 'draft' && !auth()->check()) {
            abort(404);
        }

        // Check response limit
        if ($form->response_limit && $form->response_limit > 0) {
            $responseCount = Respondent::where('form_id', $form->id)->count();
            if ($responseCount >= $form->response_limit) {
                return Inertia::render('Public/Closed', [
                    'event' => [
                        'title' => $form->event->title,
                        'logo_image' => $form->event->logo_image ? Storage::url($form->event->logo_image) : null,
                    ],
                    'form' => [
                        'name' => $form->name,
                    ],
                    'message' => 'Kuota pendaftaran untuk form ini sudah penuh.',
                    'message_en' => 'The quota for this form has been reached.',
                ]);
            }
        }

        // Send both languages so user can switch
        $questions = $form->questions->map(function ($question) {
            return [
                'id' => $question->id,
                'text_id' => $question->question_text,
                'text_en' => $question->question_text_en ?: $question->question_text,
                'description_id' => $question->description,
                'description_en' => $question->description_en ?: $question->description,
                'image' => $question->image,
                'type' => $question->type,
                'is_required' => $question->is_required,
                'options' => $question->options,
            ];
        });

        return Inertia::render('Public/Form', [
            'event' => [
                'id' => $form->event->id,
                'title' => $form->event->title,
                'description' => $form->event->description,
                'default_locale' => $form->event->locale,
                'banner_image' => $form->event->banner_image ? Storage::url($form->event->banner_image) : null,
                'logo_image' => $form->event->logo_image ? Storage::url($form->event->logo_image) : null,
                'theme_config' => $form->event->theme_config,
            ],
            'form' => [
                'id' => $form->id,
                'name' => $form->name,
                'description' => $form->description,
                'slug' => $form->slug,
                'respondent_fields' => $form->respondent_fields ?? [],
                'banner_image' => $form->banner_image ? Storage::url($form->banner_image) : null,
                'logo_image' => $form->logo_image ? Storage::url($form->logo_image) : null,
                'title' => $form->title,
            ],
            'questions' => $questions,
        ]);
    }

    /**
     * Store a new form submission.
     */
    public function submit(Request $request, string $slug): RedirectResponse
    {
        $form = Form::with('questions')
            ->where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        // Check response limit
        if ($form->response_limit && $form->response_limit > 0) {
            $responseCount = Respondent::where('form_id', $form->id)->count();
            if ($responseCount >= $form->response_limit) {
                return back()->with('error', 'Kuota pendaftaran sudah penuh.');
            }
        }

        // Build validation rules for respondent fields
        $respondentFields = $form->respondent_fields ?? [];
        $enabledFields = collect($respondentFields)->filter(fn($f) => $f['enabled'] ?? false);

        $rules = [
            'answers' => 'required|array',
        ];

        // Build custom attribute names so validation errors show field labels
        $attributes = [];
        foreach ($enabledFields as $field) {
            $key = 'respondent_data.' . $field['key'];
            $attributes[$key] = $field['label'] ?? $field['key'];
        }

        // Add dynamic respondent field validation
        foreach ($enabledFields as $field) {
            $key = 'respondent_data.' . $field['key'];
            $isRequired = $field['required'] ?? true;
            $prefix = $isRequired ? 'required' : 'nullable';
            if (($field['type'] ?? 'text') === 'email') {
                $rules[$key] = "$prefix|email|max:255";
            } else {
                $rules[$key] = "$prefix|string|max:255";
            }
        }

        // Add name/email fallback for backward compatibility
        if (!$enabledFields->contains('key', 'name')) {
            $rules['name'] = 'nullable|string|max:255';
        }
        if (!$enabledFields->contains('key', 'email')) {
            $rules['email'] = 'nullable|email|max:255';
        }

        foreach ($form->questions as $question) {
            $key = "answers.{$question->id}";
            $attributes[$key] = $question->question; // Use question text as label

            if ($question->is_required) {
                $rules[$key] = match ($question->type) {
                    'rating' => 'required|integer|min:1|max:5',
                    'file' => 'required|file|max:2048|mimes:jpg,jpeg,png,gif,pdf',
                    'multiple_choice' => 'required|string',
                    'dropdown' => 'required|string',
                    'checkbox' => 'required|array|min:1',
                    'email' => 'required|email|max:255',
                    'number' => 'required|numeric',
                    'date' => 'required|date',
                    'time' => 'required|date_format:H:i',
                    'linear_scale' => 'required|integer|min:' . ($question->options['min'] ?? 1) . '|max:' . ($question->options['max'] ?? 5),
                    default => 'required|string',
                };
            } else {
                $rules[$key] = match ($question->type) {
                    'rating' => 'nullable|integer|min:1|max:5',
                    'file' => 'nullable|file|max:2048|mimes:jpg,jpeg,png,gif,pdf',
                    'checkbox' => 'nullable|array',
                    'email' => 'nullable|email|max:255',
                    'number' => 'nullable|numeric',
                    'date' => 'nullable|date',
                    'time' => 'nullable|date_format:H:i',
                    'linear_scale' => 'nullable|integer|min:' . ($question->options['min'] ?? 1) . '|max:' . ($question->options['max'] ?? 5),
                    'multiple_choice' => 'nullable|string',
                    'dropdown' => 'nullable|string',
                    default => 'nullable|string',
                };
            }
        }

        $validated = $request->validate($rules, [], $attributes);

        // Extract respondent data
        $respondentData = $validated['respondent_data'] ?? [];
        $customFields = [];
        $respondentName = $validated['name'] ?? null;
        $respondentEmail = $validated['email'] ?? null;

        // Get formal field mapping from form config
        $respondentFields = collect($form->respondent_fields ?? []);
        
        foreach ($respondentData as $key => $value) {
            // Find field config to check label if key doesn't match
            $fieldConfig = $respondentFields->firstWhere('key', $key);
            $label = strtolower($fieldConfig['label'] ?? '');
            
            if ($key === 'name' || $label === 'nama' || $label === 'name' || $label === 'nama lengkap' || $label === 'full name') {
                if (!$respondentName) $respondentName = $value;
            } elseif ($key === 'email' || $label === 'email' || $label === 'e-mail' || ($fieldConfig['type'] ?? '') === 'email') {
                if (!$respondentEmail) $respondentEmail = $value;
            }
            
            // Always keep in custom fields too if it's not the standard key
            if ($key !== 'name' && $key !== 'email') {
                $customFields[$key] = $value;
            }
        }

        // Create respondent
        $respondent = Respondent::create([
            'form_id' => $form->id,
            'name' => $respondentName,
            'email' => $respondentEmail,
            'custom_fields' => !empty($customFields) ? $customFields : null,
            'ip_address' => $request->ip(),
            'edit_token' => ($form->allow_edit || $form->spin_wheel_enabled) ? Str::random(48) : null,
        ]);

        // Store answers
        foreach ($form->questions as $question) {
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
            } elseif ($question->type === 'checkbox' && is_array($answerValue)) {
                $answerData['answer_text'] = json_encode($answerValue);
            } else {
                $answerData['answer_text'] = $answerValue;
            }

            Answer::create($answerData);
        }

        // Return success response
        if ($form->spin_wheel_enabled && $form->prizes()->available()->exists()) {
            // Redirect to spin wheel page
            return redirect()->route('form.spin.page', [
                'slug' => $form->slug,
                'token' => $respondent->edit_token,
            ]);
        }

        // Normal flow: redirect back with success
        if ($form->allow_edit && $respondent->edit_token) {
            return back()->with([
                'success' => true,
                'edit_token' => $respondent->edit_token,
            ]);
        }

        return back()->with('success', true);
    }

    /**
     * Display thank you page.
     */
    public function thankyou(string $slug): Response
    {
        $form = Form::with('event')->where('slug', $slug)->firstOrFail();

        return Inertia::render('Public/ThankYou', [
            'event' => [
                'title' => $form->event->title,
                'logo_image' => $form->event->logo_image ? Storage::url($form->event->logo_image) : null,
            ],
            'form' => [
                'name' => $form->name,
                'slug' => $form->slug,
                'allow_edit' => $form->allow_edit,
                'thank_you_title' => $form->thank_you_title,
                'thank_you_message' => $form->thank_you_message,
                'thank_you_button_text' => $form->thank_you_button_text,
                'thank_you_button_url' => $form->thank_you_button_url,
            ],
        ]);
    }

    /**
     * Display spin wheel page.
     */
    public function spinPage(string $slug, string $token): Response|RedirectResponse
    {
        $form = Form::with(['event', 'prizes' => function ($q) {
            $q->available()->orderBy('sort_order');
        }])->where('slug', $slug)->firstOrFail();

        if (!$form->spin_wheel_enabled) {
            return redirect()->route('form.thankyou', $slug);
        }

        // Find respondent by token
        $respondent = Respondent::where('form_id', $form->id)
            ->where('edit_token', $token)
            ->first();

        if (!$respondent) {
            return redirect()->route('form.thankyou', $slug);
        }

        // Check if already spun
        $existingResult = SpinResult::where('respondent_id', $respondent->id)->first();
        if ($existingResult) {
            return redirect()->route('form.thankyou', $slug)
                ->with('already_spun', true)
                ->with('spin_prize', $existingResult->prize ? $existingResult->prize->name : null);
        }

        return Inertia::render('Public/SpinWheel', [
            'event' => [
                'title' => $form->event->title,
                'logo_image' => $form->event->logo_image ? Storage::url($form->event->logo_image) : null,
            ],
            'form' => [
                'slug' => $form->slug,
                'spin_wheel_title' => $form->spin_wheel_title ?? 'Putar & Dapatkan Hadiah!',
                'spin_wheel_btn_text' => $form->spin_wheel_btn_text ?? 'PUTAR!',
                'spin_wheel_btn_color' => $form->spin_wheel_btn_color ?? '#f17720',
                'spin_wheel_pointer_color' => $form->spin_wheel_pointer_color ?? '#e74c3c',
                'spin_wheel_sound_spin' => $form->spin_wheel_sound_spin ? Storage::url($form->spin_wheel_sound_spin) : null,
                'spin_wheel_sound_bgm' => $form->spin_wheel_sound_bgm ? Storage::url($form->spin_wheel_sound_bgm) : null,
                'spin_wheel_sound_win' => $form->spin_wheel_sound_win ? Storage::url($form->spin_wheel_sound_win) : null,
                'spin_wheel_sound_bgm_enabled' => (bool) $form->spin_wheel_sound_bgm_enabled,
                'spin_wheel_sound_spin_enabled' => (bool) $form->spin_wheel_sound_spin_enabled,
                'spin_wheel_sound_win_enabled' => (bool) $form->spin_wheel_sound_win_enabled,
                'spin_wheel_result_message' => $form->spin_wheel_result_message,
            ],
            'prizes' => $form->prizes->map(function ($prize) {
                return [
                    'id' => $prize->id,
                    'name' => $prize->name,
                    'name_en' => $prize->name_en,
                    'image' => $prize->image ? Storage::url($prize->image) : null,
                    'color' => $prize->color,
                    'probability' => (float) $prize->probability,
                ];
            }),
            'respondent_id' => $respondent->id,
            'token' => $token,
        ]);
    }

    /**
     * Handle spin action — determine prize with weighted random.
     */
    public function spin(string $slug, Request $request)
    {
        $form = Form::with(['prizes' => function ($q) {
            $q->available()->orderBy('sort_order');
        }])->where('slug', $slug)->firstOrFail();

        if (!$form->spin_wheel_enabled) {
            return response()->json(['error' => 'Spin wheel tidak aktif.'], 403);
        }

        $request->validate([
            'respondent_id' => 'required|integer|exists:respondents,id',
            'phone_number' => 'required|string|min:8|max:20',
        ]);

        $respondentId = $request->respondent_id;

        // Check: respondent already spun?
        if (SpinResult::where('respondent_id', $respondentId)->exists()) {
            return response()->json(['error' => 'Anda sudah memutar roda.'], 409);
        }

        // Check: phone number already claimed in this form?
        $phoneUsed = SpinResult::where('phone_number', $request->phone_number)
            ->whereHas('respondent', function ($q) use ($form) {
                $q->where('form_id', $form->id);
            })
            ->exists();

        if ($phoneUsed) {
            return response()->json(['error' => 'Nomor HP ini sudah pernah digunakan untuk klaim hadiah.'], 409);
        }

        $prizes = $form->prizes;

        if ($prizes->isEmpty()) {
            return response()->json(['error' => 'Tidak ada hadiah tersedia.'], 404);
        }

        // Weighted random selection
        $totalProbability = $prizes->sum('probability');
        if ($totalProbability <= 0) {
            return response()->json(['error' => 'Konfigurasi hadiah tidak valid.'], 500);
        }

        $random = mt_rand(0, (int) ($totalProbability * 100)) / 100;
        $cumulative = 0;
        $wonPrize = null;

        foreach ($prizes as $prize) {
            $cumulative += (float) $prize->probability;
            if ($random <= $cumulative) {
                $wonPrize = $prize;
                break;
            }
        }

        // Fallback to last prize
        if (!$wonPrize) {
            $wonPrize = $prizes->last();
        }

        // Update won count
        $wonPrize->increment('won_count');

        // Create spin result
        $spinResult = SpinResult::create([
            'respondent_id' => $respondentId,
            'prize_id' => $wonPrize->id,
            'phone_number' => $request->phone_number,
            'status' => 'won',
        ]);

        return response()->json([
            'success' => true,
            'prize' => [
                'id' => $wonPrize->id,
                'name' => $wonPrize->name,
                'name_en' => $wonPrize->name_en,
                'image' => $wonPrize->image ? Storage::url($wonPrize->image) : null,
                'color' => $wonPrize->color,
            ],
            'result_message' => $form->spin_wheel_result_message ?? 'Tim kami akan menghubungi Anda untuk proses klaim hadiah.',
        ]);
    }

    /**
     * Show form pre-filled with previous answers for editing.
     */
    public function edit(string $slug, string $token): Response|RedirectResponse
    {
        $form = Form::with(['questions' => function ($query) {
            $query->orderBy('sort_order');
        }, 'event'])->where('slug', $slug)->firstOrFail();

        if (!$form->allow_edit) {
            abort(403, 'Editing is not allowed for this form.');
        }

        $respondent = Respondent::with('answers')
            ->where('form_id', $form->id)
            ->where('edit_token', $token)
            ->firstOrFail();

        // Build existing answers map
        $existingAnswers = [];
        foreach ($respondent->answers as $answer) {
            $question = $form->questions->firstWhere('id', $answer->form_question_id);
            if (!$question) continue;

            if ($question->type === 'rating') {
                $existingAnswers[$answer->form_question_id] = $answer->answer_numeric;
            } elseif ($question->type === 'checkbox') {
                $existingAnswers[$answer->form_question_id] = json_decode($answer->answer_text, true) ?? [];
            } elseif ($question->type === 'file') {
                $existingAnswers[$answer->form_question_id] = $answer->file_path ? Storage::url($answer->file_path) : null;
            } else {
                $existingAnswers[$answer->form_question_id] = $answer->answer_text;
            }
        }

        // Build questions for frontend
        $questions = $form->questions->map(function ($question) {
            return [
                'id' => $question->id,
                'text_id' => $question->question_text,
                'text_en' => $question->question_text_en ?: $question->question_text,
                'description_id' => $question->description,
                'description_en' => $question->description_en ?: $question->description,
                'image' => $question->image,
                'type' => $question->type,
                'is_required' => $question->is_required,
                'options' => $question->options,
            ];
        });

        // Build respondent data for pre-filling
        $respondentData = [];
        foreach ($form->respondent_fields ?? [] as $field) {
            if (!($field['enabled'] ?? false)) continue;
            $key = $field['key'];
            if ($key === 'name') {
                $respondentData[$key] = $respondent->name;
            } elseif ($key === 'email') {
                $respondentData[$key] = $respondent->email;
            } else {
                $respondentData[$key] = $respondent->custom_fields[$key] ?? '';
            }
        }

        return Inertia::render('Public/Form', [
            'event' => [
                'id' => $form->event->id,
                'title' => $form->event->title,
                'description' => $form->event->description,
                'default_locale' => $form->event->locale,
                'banner_image' => $form->event->banner_image ? Storage::url($form->event->banner_image) : null,
                'logo_image' => $form->event->logo_image ? Storage::url($form->event->logo_image) : null,
                'theme_config' => $form->event->theme_config,
            ],
            'form' => [
                'id' => $form->id,
                'name' => $form->name,
                'description' => $form->description,
                'slug' => $form->slug,
                'respondent_fields' => $form->respondent_fields ?? [],
                'banner_image' => $form->banner_image ? Storage::url($form->banner_image) : null,
                'logo_image' => $form->logo_image ? Storage::url($form->logo_image) : null,
                'title' => $form->title,
            ],
            'questions' => $questions,
            'editMode' => true,
            'editToken' => $token,
            'existingAnswers' => $existingAnswers,
            'existingRespondentData' => $respondentData,
        ]);
    }

    /**
     * Update existing form submission.
     */
    public function update(Request $request, string $slug, string $token): RedirectResponse
    {
        $form = Form::with('questions')
            ->where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        if (!$form->allow_edit) {
            abort(403, 'Editing is not allowed for this form.');
        }

        $respondent = Respondent::where('form_id', $form->id)
            ->where('edit_token', $token)
            ->firstOrFail();

        // Build validation rules (same as submit)
        $respondentFields = $form->respondent_fields ?? [];
        $enabledFields = collect($respondentFields)->filter(fn($f) => $f['enabled'] ?? false);

        $rules = [
            'answers' => 'required|array',
        ];

        // Build custom attribute names so validation errors show field labels
        $attributes = [];

        foreach ($enabledFields as $field) {
            $key = 'respondent_data.' . $field['key'];
            $attributes[$key] = $field['label'] ?? $field['key'];
            $isRequired = $field['required'] ?? true;
            $prefix = $isRequired ? 'required' : 'nullable';
            if (($field['type'] ?? 'text') === 'email') {
                $rules[$key] = "$prefix|email|max:255";
            } else {
                $rules[$key] = "$prefix|string|max:255";
            }
        }

        if (!$enabledFields->contains('key', 'name')) {
            $rules['name'] = 'nullable|string|max:255';
        }
        if (!$enabledFields->contains('key', 'email')) {
            $rules['email'] = 'nullable|email|max:255';
        }

        foreach ($form->questions as $question) {
            $key = "answers.{$question->id}";
            $attributes[$key] = $question->question;

            if ($question->is_required) {
                $rules[$key] = match ($question->type) {
                    'rating' => 'required|integer|min:1|max:5',
                    'file' => 'nullable|file|max:2048|mimes:jpg,jpeg,png,gif,pdf', // nullable for edit (keep existing)
                    'multiple_choice' => 'required|string',
                    'dropdown' => 'required|string',
                    'checkbox' => 'required|array|min:1',
                    'email' => 'required|email|max:255',
                    'number' => 'required|numeric',
                    'date' => 'required|date',
                    'time' => 'required|date_format:H:i',
                    'linear_scale' => 'required|integer|min:' . ($question->options['min'] ?? 1) . '|max:' . ($question->options['max'] ?? 5),
                    default => 'required|string',
                };
            } else {
                $rules[$key] = match ($question->type) {
                    'rating' => 'nullable|integer|min:1|max:5',
                    'file' => 'nullable|file|max:2048|mimes:jpg,jpeg,png,gif,pdf',
                    'checkbox' => 'nullable|array',
                    'email' => 'nullable|email|max:255',
                    'number' => 'nullable|numeric',
                    'date' => 'nullable|date',
                    'linear_scale' => 'nullable|integer|min:' . ($question->options['min'] ?? 1) . '|max:' . ($question->options['max'] ?? 5),
                    'multiple_choice' => 'nullable|string',
                    'dropdown' => 'nullable|string',
                    default => 'nullable|string',
                };
            }
        }

        $validated = $request->validate($rules, [], $attributes);

        // Update respondent data
        $respondentData = $validated['respondent_data'] ?? [];
        $customFields = [];
        $respondentName = $validated['name'] ?? $respondent->name;
        $respondentEmail = $validated['email'] ?? $respondent->email;

        foreach ($respondentData as $key => $value) {
            if ($key === 'name') {
                $respondentName = $value;
            } elseif ($key === 'email') {
                $respondentEmail = $value;
            } else {
                $customFields[$key] = $value;
            }
        }

        $respondent->update([
            'name' => $respondentName,
            'email' => $respondentEmail,
            'custom_fields' => !empty($customFields) ? $customFields : $respondent->custom_fields,
        ]);

        // Update answers (delete old, create new)
        foreach ($form->questions as $question) {
            $answerValue = $validated['answers'][$question->id] ?? null;

            // Delete existing answer for this question
            Answer::where('respondent_id', $respondent->id)
                ->where('form_question_id', $question->id)
                ->delete();

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
            } elseif ($question->type === 'checkbox' && is_array($answerValue)) {
                $answerData['answer_text'] = json_encode($answerValue);
            } else {
                $answerData['answer_text'] = $answerValue;
            }

            Answer::create($answerData);
        }

        return redirect()->route('form.thankyou', $slug)->with('edited', true);
    }
}
