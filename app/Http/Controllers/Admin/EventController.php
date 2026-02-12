<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Form;
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
            ->withCount('forms')
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
                    'form_count' => $event->forms_count,
                    'response_count' => $event->response_count,
                    'event_date' => $event->event_date?->format('d M Y'),
                    'created_at' => $event->created_at->format('d M Y'),
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
            ->route('admin.events.forms', $event)
            ->with('success', __('Event berhasil dibuat. Silakan buat form untuk event ini.'));
    }

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
            ],
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
     * Display a listing of all responses across all forms.
     */
    public function allResponses(Request $request): Response
    {
        $respondents = \App\Models\Respondent::with(['form.event', 'answers.question'])
            ->orderBy('submitted_at', 'desc')
            ->paginate(20)
            ->through(function ($respondent) {
                return [
                    'id' => $respondent->id,
                    'event_title' => $respondent->form->event->title,
                    'form_name' => $respondent->form->name,
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

    /**
     * Update event theme config.
     */
    public function updateThemeConfig(Request $request, Event $event): RedirectResponse
    {
        $validated = $request->validate([
            'custom_labels' => 'nullable|array',
            'custom_labels.name' => 'nullable|string',
            'custom_labels.name_en' => 'nullable|string',
            'custom_labels.email' => 'nullable|string',
            'custom_labels.email_en' => 'nullable|string',
        ]);

        $themeConfig = $event->theme_config ?? [];
        $themeConfig['custom_labels'] = $validated['custom_labels'] ?? [];
        
        $event->theme_config = $themeConfig;
        $event->save();

        return back()->with('success', __('Pengaturan tampilan berhasil diperbarui.'));
    }
}
