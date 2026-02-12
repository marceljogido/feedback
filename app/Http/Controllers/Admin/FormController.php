<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Form;
use App\Models\FormQuestion;
use App\Models\Respondent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FormController extends Controller
{
    /**
     * Display forms for an event.
     */
    public function index(Event $event): Response
    {
        $forms = $event->forms()
            ->withCount('respondents')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($form) {
                return [
                    'id' => $form->id,
                    'name' => $form->name,
                    'slug' => $form->slug,
                    'status' => $form->status,
                    'response_count' => $form->respondents_count,
                    'public_url' => url("/form/{$form->slug}"),
                    'created_at' => $form->created_at->format('d M Y'),
                ];
            });

        return Inertia::render('Admin/Events/Forms', [
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'slug' => $event->slug,
            ],
            'forms' => $forms,
        ]);
    }

    /**
     * Show form to create a new form.
     */
    public function create(Event $event): Response
    {
        return Inertia::render('Admin/Forms/Create', [
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
            ],
        ]);
    }

    /**
     * Store a new form.
     */
    public function store(Request $request, Event $event): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $slug = Str::slug($validated['name']) . '-' . Str::lower(Str::random(6));

        $form = $event->forms()->create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'status' => 'draft',
        ]);

        return redirect()
            ->route('admin.forms.builder', $form)
            ->with('success', __('Form berhasil dibuat. Silakan tambahkan pertanyaan.'));
    }

    /**
     * Show form settings.
     */
    public function edit(Form $form): Response
    {
        return Inertia::render('Admin/Forms/Edit', [
            'form' => [
                'id' => $form->id,
                'name' => $form->name,
                'slug' => $form->slug,
                'description' => $form->description,
                'status' => $form->status,
                'opens_at' => $form->opens_at?->format('Y-m-d\TH:i'),
                'closes_at' => $form->closes_at?->format('Y-m-d\TH:i'),
                'allow_edit' => $form->allow_edit,
                'public_url' => url("/form/{$form->slug}"),
            ],
            'event' => [
                'id' => $form->event->id,
                'title' => $form->event->title,
                'theme_config' => $form->event->theme_config,
            ],
        ]);
    }

    /**
     * Update form settings.
     */
    public function update(Request $request, Form $form): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|regex:/^[a-z0-9-]+$/|unique:forms,slug,' . $form->id,
            'description' => 'nullable|string',
            'opens_at' => 'nullable|date',
            'closes_at' => 'nullable|date|after_or_equal:opens_at',
            'allow_edit' => 'boolean',
            'thank_you_title' => 'nullable|string|max:255',
            'thank_you_message' => 'nullable|string',
            'thank_you_button_text' => 'nullable|string|max:50',
            'thank_you_button_url' => 'nullable|url|max:255',
            'response_limit' => 'nullable|integer|min:1',
        ]);

        // Convert empty strings to null for timestamps
        $validated['opens_at'] = $validated['opens_at'] ?: null;
        $validated['closes_at'] = $validated['closes_at'] ?: null;

        $form->update($validated);

        return back()->with('success', __('Form berhasil diperbarui.'));
    }

    /**
     * Delete a form.
     */
    public function destroy(Form $form): RedirectResponse
    {
        $eventId = $form->event_id;
        $form->delete();

        return redirect()
            ->route('admin.events.forms', $eventId)
            ->with('success', __('Form berhasil dihapus.'));
    }

    /**
     * Delete a single response.
     */
    public function destroyResponse(Respondent $respondent): RedirectResponse
    {
        $formId = $respondent->form_id;
        $respondent->delete();

        return back()->with('success', __('Respon berhasil dihapus.'));
    }

    /**
     * Delete all responses for a form.
     */
    public function destroyAllResponses(Form $form): RedirectResponse
    {
        $form->respondents()->delete();

        return back()->with('success', __('Semua respon berhasil dihapus.'));
    }

    /**
     * Show the form builder.
     */
    public function builder(Form $form): Response
    {
        $questions = $form->questions()
            ->orderBy('sort_order')
            ->get()
            ->map(function ($question) {
                return [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
                    'question_text_en' => $question->question_text_en,
                    'description' => $question->description,
                    'description_en' => $question->description_en,
                    'image' => $question->image,
                    'type' => $question->type,
                    'is_required' => $question->is_required,
                    'options' => $question->options,
                    'sort_order' => $question->sort_order,
                ];
            });

        return Inertia::render('Admin/Forms/FormBuilder', [
            'form' => [
                'id' => $form->id,
                'name' => $form->name,
                'slug' => $form->slug,
                'status' => $form->status,
                'public_url' => url("/form/{$form->slug}"),
                'collect_name' => $form->collect_name,
                'collect_email' => $form->collect_email,
                'name_label' => $form->name_label,
                'email_label' => $form->email_label,
                'respondent_fields' => $form->respondent_fields ?? [],
                'banner_image' => $form->banner_image ? asset('storage/' . $form->banner_image) : null,
                'logo_image' => $form->logo_image ? asset('storage/' . $form->logo_image) : null,
                'title' => $form->title,
                'description' => $form->description,
            ],
            'event' => [
                'id' => $form->event->id,
                'title' => $form->event->title,
                'description' => $form->event->description,
                'logo_image' => $form->event->logo_image ? asset('storage/' . $form->event->logo_image) : null,
                'banner_image' => $form->event->banner_image ? asset('storage/' . $form->event->banner_image) : null,
            ],
            'questions' => $questions,
        ]);
    }

    /**
     * Save form questions.
     */
    public function saveQuestions(Request $request, Form $form): RedirectResponse
    {
        $validated = $request->validate([
            'questions' => 'required|array',
            'questions.*.id' => 'nullable|integer|exists:form_questions,id',
            'questions.*.question_text' => 'required|string',
            'questions.*.question_text_en' => 'nullable|string',
            'questions.*.description' => 'nullable|string|max:500',
            'questions.*.description_en' => 'nullable|string|max:500',
            'questions.*.image' => 'nullable|string',
            'questions.*.type' => 'required|in:text,textarea,rating,file,multiple_choice,email,number,checkbox,dropdown,date,linear_scale',
            'questions.*.is_required' => 'boolean',
            'questions.*.options' => 'nullable|array',
            'questions.*.sort_order' => 'required|integer',
        ]);

        // Get existing question IDs
        $existingIds = collect($validated['questions'])
            ->pluck('id')
            ->filter()
            ->toArray();

        // Delete removed questions
        $form->questions()
            ->whereNotIn('id', $existingIds)
            ->delete();

        // Upsert questions
        foreach ($validated['questions'] as $questionData) {
            if (isset($questionData['id'])) {
                FormQuestion::where('id', $questionData['id'])
                    ->update([
                        'question_text' => $questionData['question_text'],
                        'question_text_en' => $questionData['question_text_en'] ?? null,
                        'description' => $questionData['description'] ?? null,
                        'description_en' => $questionData['description_en'] ?? null,
                        'image' => $questionData['image'] ?? null,
                        'type' => $questionData['type'],
                        'is_required' => $questionData['is_required'] ?? false,
                        'options' => $questionData['options'] ?? null,
                        'sort_order' => $questionData['sort_order'],
                    ]);
            } else {
                $form->questions()->create([
                    'question_text' => $questionData['question_text'],
                    'question_text_en' => $questionData['question_text_en'] ?? null,
                    'description' => $questionData['description'] ?? null,
                    'description_en' => $questionData['description_en'] ?? null,
                    'image' => $questionData['image'] ?? null,
                    'type' => $questionData['type'],
                    'is_required' => $questionData['is_required'] ?? false,
                    'options' => $questionData['options'] ?? null,
                    'sort_order' => $questionData['sort_order'],
                ]);
            }
        }

        return back()->with('success', __('Pertanyaan berhasil disimpan.'));
    }

    /**
     * View form responses.
     */
    public function responses(Request $request, Form $form): Response
    {
        $query = $form->respondents()->with(['answers.question']);

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%")
                    ->orWhere('custom_fields', 'ilike', "%{$search}%")
                    ->orWhereHas('answers', function ($q) use ($search) {
                        $q->where('answer_text', 'ilike', "%{$search}%")
                          ->orWhere('file_path', 'ilike', "%{$search}%");
                    });
            });
        }

        $responses = $query->orderBy('submitted_at', 'asc')
            ->paginate(20)
            ->withQueryString()
            ->through(function ($respondent) {
                $answers = $respondent->answers->map(function ($answer) {
                    return [
                        'question' => $answer->question->question_text,
                        'type' => $answer->question->type,
                        'value' => $answer->formatted_answer,
                    ];
                });

                return [
                    'id' => $respondent->id,
                    'name' => $respondent->name ?? 'Anonim',
                    'email' => $respondent->email,
                    'submitted_at' => $respondent->submitted_at->format('d M Y H:i'),
                    'answers' => $answers,
                ];
            });

        // Calculate stats
        $avgRating = $form->average_rating;
        $totalResponses = $form->respondents()->count();

        // Get questions for table headers
        $questions = $form->questions()
            ->orderBy('sort_order')
            ->get()
            ->map(function ($q) {
                return [
                    'id' => $q->id,
                    'question_text' => $q->question_text,
                    'type' => $q->type,
                ];
            });

        return Inertia::render('Admin/Forms/Responses', [
            'form' => [
                'id' => $form->id,
                'name' => $form->name,
                'slug' => $form->slug,
            ],
            'event' => [
                'id' => $form->event->id,
                'title' => $form->event->title,
            ],
            'responses' => $responses,
            'stats' => [
                'totalResponses' => $totalResponses,
                'avgRating' => $avgRating ? round($avgRating, 1) : null,
            ],
            'questions' => $questions,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Toggle form status.
     */
    public function toggleStatus(Form $form): RedirectResponse
    {
        $newStatus = $form->status === 'active' ? 'closed' : 'active';
        $form->update(['status' => $newStatus]);

        return back()->with('success', __('Status form berhasil diubah.'));
    }

    /**
     * Update respondent fields settings.
     */
    public function updateCollectSettings(Request $request, Form $form)
    {
        $validated = $request->validate([
            'respondent_fields' => 'required|array',
            'respondent_fields.*.key' => 'required|string|max:50',
            'respondent_fields.*.label' => 'required|string|max:255',
            'respondent_fields.*.type' => 'required|in:text,email,number',
            'respondent_fields.*.enabled' => 'required|boolean',
            'respondent_fields.*.required' => 'required|boolean',
        ]);

        $form->update([
            'respondent_fields' => $validated['respondent_fields'],
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * Export form responses as CSV.
     */
    public function exportCsv(Form $form)
    {
        $form->load(['questions' => function ($q) {
            $q->orderBy('sort_order');
        }]);

        $respondents = $form->respondents()
            ->with(['answers.question'])
            ->orderBy('submitted_at', 'desc')
            ->get();

        // Build headers
        $headers = ['No', 'Nama', 'Email', 'Tanggal Submit'];
        $questions = $form->questions;
        foreach ($questions as $question) {
            $headers[] = $question->question_text;
        }

        // Build rows
        $rows = [];
        $no = 1;
        foreach ($respondents as $respondent) {
            $row = [
                $no++,
                $respondent->name ?? 'Anonim',
                $respondent->email ?? '-',
                $respondent->submitted_at ? $respondent->submitted_at->format('d/m/Y H:i') : '-',
            ];

            // Map answers by question_id for easy lookup
            $answerMap = [];
            foreach ($respondent->answers as $answer) {
                $answerMap[$answer->form_question_id] = $answer;
            }

            foreach ($questions as $question) {
                $answer = $answerMap[$question->id] ?? null;
                if (!$answer) {
                    $row[] = '-';
                } elseif ($question->type === 'rating') {
                    if ($answer->answer_numeric) {
                        $filled = str_repeat('★', (int) $answer->answer_numeric);
                        $empty = str_repeat('☆', 5 - (int) $answer->answer_numeric);
                        $row[] = $filled . $empty . ' (' . $answer->answer_numeric . '/5)';
                    } else {
                        $row[] = '-';
                    }
                } elseif ($question->type === 'file') {
                    $row[] = $answer->file_path ? url('storage/' . $answer->file_path) : '-';
                } else {
                    $row[] = $answer->answer_text ?? '-';
                }
            }

            $rows[] = $row;
        }

        // Generate CSV
        $filename = 'responses-' . \Str::slug($form->name) . '-' . now()->format('Y-m-d') . '.csv';
        $event = $form->event;

        $callback = function () use ($headers, $rows, $form, $event, $respondents) {
            $file = fopen('php://output', 'w');
            // UTF-8 BOM for Excel compatibility
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Metadata header
            fputcsv($file, ['Nama Event', $event->title], ';');
            fputcsv($file, ['Nama Kuesioner', $form->name], ';');
            fputcsv($file, ['Tanggal Export', now()->format('d/m/Y H:i')], ';');
            fputcsv($file, ['Total Responden', $respondents->count()], ';');
            fputcsv($file, [], ';'); // Empty row separator

            // Data table
            fputcsv($file, $headers, ';');
            foreach ($rows as $row) {
                fputcsv($file, $row, ';');
            }
            fclose($file);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Upload question image.
     */
    public function uploadQuestionImage(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
        ]);

        $path = $request->file('image')->store('question-images', 'public');

        return response()->json([
            'success' => true,
            'path' => $path,
            'url' => asset('storage/' . $path),
        ]);
    }

    /**
     * Delete question image.
     */
    public function deleteQuestionImage(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'path' => 'required|string',
        ]);

        $path = $request->input('path');
        
        if (\Storage::disk('public')->exists($path)) {
            \Storage::disk('public')->delete($path);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Upload form banner image.
     */
    public function uploadBanner(Request $request, Form $form): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        // Delete old banner if exists
        if ($form->banner_image && \Storage::disk('public')->exists($form->banner_image)) {
            \Storage::disk('public')->delete($form->banner_image);
        }

        $path = $request->file('image')->store('form-banners', 'public');
        $form->update(['banner_image' => $path]);

        return response()->json([
            'success' => true,
            'path' => $path,
            'url' => asset('storage/' . $path),
        ]);
    }

    /**
     * Upload form logo image.
     */
    public function uploadLogo(Request $request, Form $form): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        // Delete old logo if exists
        if ($form->logo_image && \Storage::disk('public')->exists($form->logo_image)) {
            \Storage::disk('public')->delete($form->logo_image);
        }

        $path = $request->file('image')->store('form-logos', 'public');
        $form->update(['logo_image' => $path]);

        return response()->json([
            'success' => true,
            'path' => $path,
            'url' => asset('storage/' . $path),
        ]);
    }

    /**
     * Update form header (title/description).
     */
    public function updateHeader(Request $request, Form $form): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        $form->update($validated);

        return response()->json(['success' => true]);
    }


    /**
     * Duplicate a form.
     */
    public function duplicate(Form $form): RedirectResponse
    {
        // Replicate form
        $newForm = $form->replicate();
        $newForm->name = $form->name . ' (Copy)';
        $newForm->slug = Str::slug($newForm->name) . '-' . Str::lower(Str::random(6));
        $newForm->status = 'draft';
        $newForm->created_at = now();
        $newForm->updated_at = now();
        $newForm->save();

        // Replicate questions
        foreach ($form->questions as $question) {
            $newQuestion = $question->replicate();
            $newQuestion->form_id = $newForm->id;
            $newQuestion->created_at = now();
            $newQuestion->updated_at = now();
            $newQuestion->save();
        }

        return redirect()
            ->route('admin.events.forms', $form->event_id)
            ->with('success', __('Form berhasil diduplikasi.'));
    }
}
