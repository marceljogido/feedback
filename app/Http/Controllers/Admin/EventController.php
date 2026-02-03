<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\FormQuestion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    /**
     * Display a listing of events.
     */
    public function index(Request $request): Response
    {
        $events = Event::with('user')
            ->withCount('respondents')
            ->when($request->search, function ($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->through(function ($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'slug' => $event->slug,
                    'status' => $event->status,
                    'locale' => $event->locale,
                    'response_count' => $event->respondents_count,
                    'event_date' => $event->event_date?->format('d M Y'),
                    'created_at' => $event->created_at->format('d M Y'),
                    'public_url' => url("/form/{$event->slug}"),
                ];
            });

        return Inertia::render('Admin/Events/Index', [
            'events' => $events,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new event.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/Events/Create');
    }

    /**
     * Store a newly created event.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'event_date' => 'nullable|date',
            'locale' => 'required|in:id,en',
            'banner_image' => 'nullable|image|max:2048',
            'logo_image' => 'nullable|image|max:1024',
        ]);

        // Generate unique slug
        $slug = Str::slug($validated['title']) . '-' . Str::lower(Str::random(6));

        $event = Event::create([
            'user_id' => auth()->id(),
            'title' => $validated['title'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'event_date' => $validated['event_date'] ?? null,
            'locale' => $validated['locale'],
            'status' => 'draft',
        ]);

        // Handle file uploads
        if ($request->hasFile('banner_image')) {
            $event->banner_image = $request->file('banner_image')->store('banners', 'public');
            $event->save();
        }

        if ($request->hasFile('logo_image')) {
            $event->logo_image = $request->file('logo_image')->store('logos', 'public');
            $event->save();
        }

        return redirect()
            ->route('admin.events.builder', $event)
            ->with('success', __('Event berhasil dibuat. Silakan tambahkan pertanyaan.'));
    }

    /**
     * Show the form builder for an event.
     */
    /**
     * Show the settings for an event.
     */
    public function edit(Event $event): Response
    {
        return Inertia::render('Admin/Events/Edit', [
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'slug' => $event->slug,
                'description' => $event->description,
                'status' => $event->status,
                'locale' => $event->locale,
                'banner_image' => $event->banner_image ? Storage::url($event->banner_image) : null,
                'logo_image' => $event->logo_image ? Storage::url($event->logo_image) : null,
                'event_date' => $event->event_date?->format('Y-m-d'),
                'public_url' => url("/form/{$event->slug}"),
            ],
        ]);
    }

    /**
     * Show the form builder for an event.
     */
    public function builder(Event $event): Response
    {
        $questions = $event->questions()
            ->orderBy('sort_order')
            ->get()
            ->map(function ($question) {
                return [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
                    'question_text_en' => $question->question_text_en,
                    'type' => $question->type,
                    'is_required' => $question->is_required,
                    'options' => $question->options,
                    'sort_order' => $question->sort_order,
                ];
            });

        return Inertia::render('Admin/Events/FormBuilder', [
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'file_name' => $event->title, // Just for display if needed
                'slug' => $event->slug,
                'status' => $event->status,
                'public_url' => url("/form/{$event->slug}"),
            ],
            'questions' => $questions,
        ]);
    }

    /**
     * Update event details.
     */
    public function update(Request $request, Event $event): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|regex:/^[a-z0-9-]+$/|unique:events,slug,' . $event->id,
            'description' => 'nullable|string',
            'event_date' => 'nullable|date',
            'locale' => 'required|in:id,en',
            'banner_image' => 'nullable|image|max:2048',
            'logo_image' => 'nullable|image|max:1024',
        ]);

        $event->update([
            'title' => $validated['title'],
            'slug' => $validated['slug'],
            'description' => $validated['description'],
            'event_date' => $validated['event_date'],
            'locale' => $validated['locale'],
        ]);

        // Handle file uploads
        if ($request->hasFile('banner_image')) {
            // Delete old banner if exists
            if ($event->banner_image) {
                Storage::disk('public')->delete($event->banner_image);
            }
            $event->banner_image = $request->file('banner_image')->store('banners', 'public');
            $event->save();
        }

        if ($request->hasFile('logo_image')) {
            // Delete old logo if exists
            if ($event->logo_image) {
                Storage::disk('public')->delete($event->logo_image);
            }
            $event->logo_image = $request->file('logo_image')->store('logos', 'public');
            $event->save();
        }

        return back()->with('success', __('Event berhasil diperbarui.'));
    }

    /**
     * Save form questions for an event.
     */
    public function saveQuestions(Request $request, Event $event): RedirectResponse
    {
        $validated = $request->validate([
            'questions' => 'required|array',
            'questions.*.id' => 'nullable|integer|exists:form_questions,id',
            'questions.*.question_text' => 'required|string',
            'questions.*.question_text_en' => 'nullable|string',
            'questions.*.type' => 'required|in:text,textarea,rating,file,multiple_choice',
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
        $event->questions()
            ->whereNotIn('id', $existingIds)
            ->delete();

        // Upsert questions
        foreach ($validated['questions'] as $questionData) {
            if (isset($questionData['id'])) {
                FormQuestion::where('id', $questionData['id'])
                    ->update([
                        'question_text' => $questionData['question_text'],
                        'question_text_en' => $questionData['question_text_en'] ?? null,
                        'type' => $questionData['type'],
                        'is_required' => $questionData['is_required'] ?? false,
                        'options' => $questionData['options'] ?? null,
                        'sort_order' => $questionData['sort_order'],
                    ]);
            } else {
                $event->questions()->create([
                    'question_text' => $questionData['question_text'],
                    'question_text_en' => $questionData['question_text_en'] ?? null,
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
     * View responses for an event.
     */
    public function responses(Event $event): Response
    {
        $responses = $event->respondents()
            ->with(['answers.question'])
            ->orderBy('submitted_at', 'desc')
            ->paginate(20)
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
        $avgRating = $event->average_rating;
        $totalResponses = $event->respondents()->count();

        return Inertia::render('Admin/Events/Responses', [
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'slug' => $event->slug,
            ],
            'responses' => $responses,
            'stats' => [
                'totalResponses' => $totalResponses,
                'avgRating' => $avgRating ? round($avgRating, 1) : null,
            ],
        ]);
    }

    /**
     * Toggle event status.
     */
    public function toggleStatus(Event $event): RedirectResponse
    {
        $newStatus = $event->status === 'active' ? 'closed' : 'active';
        $event->update(['status' => $newStatus]);

        return back()->with('success', __('Status event berhasil diubah.'));
    }

    /**
     * Delete an event.
     */
    public function destroy(Event $event): RedirectResponse
    {
        $event->delete();

        return redirect()
            ->route('admin.events.index')
            ->with('success', __('Event berhasil dihapus.'));
    }

    /**
     * Display a listing of forms (Events focused on form management).
     */
    public function forms(Request $request): Response
    {
        $events = Event::with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->through(function ($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'slug' => $event->slug,
                    'status' => $event->status,
                    'public_url' => url("/form/{$event->slug}"),
                    'updated_at' => $event->updated_at->format('d M Y'),
                ];
            });

        return Inertia::render('Admin/Forms/Index', [
            'events' => $events,
        ]);
    }

    /**
     * Display a listing of all responses across all events.
     */
    public function allResponses(Request $request): Response
    {
        // Need to join events to get event title
        $respondents = \App\Models\Respondent::with(['event', 'answers.question'])
            ->orderBy('submitted_at', 'desc')
            ->paginate(20)
            ->through(function ($respondent) {
                return [
                    'id' => $respondent->id,
                    'event_title' => $respondent->event->title,
                    'name' => $respondent->name ?? 'Anonim',
                    'email' => $respondent->email,
                    'submitted_at' => $respondent->submitted_at->format('d M Y H:i'),
                    'answers' => $respondent->answers->map(function ($answer) {
                        return [
                            'question' => $answer->question->question_text,
                            'type' => $answer->question->type,
                            'value' => $answer->formatted_answer,
                        ];
                    }),
                ];
            });

        return Inertia::render('Admin/Responses/Index', [
            'respondents' => $respondents,
        ]);
    }
}
