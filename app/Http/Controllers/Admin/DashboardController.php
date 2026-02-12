<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Form;
use App\Models\Respondent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the admin dashboard.
     */
    public function index(): Response
    {
        $user = auth()->user();
        
        // Get statistics
        $totalEvents = Event::count();
        $totalForms = Form::count();
        $totalResponses = Respondent::count();
        
        // Calculate average rating across all forms
        $avgRating = \DB::table('answers')
            ->join('form_questions', 'answers.form_question_id', '=', 'form_questions.id')
            ->where('form_questions.type', 'rating')
            ->whereNotNull('answers.answer_numeric')
            ->avg('answers.answer_numeric');
        
        // Get recent events with response count
        $recentEvents = Event::with('user')
            ->withCount('forms')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'slug' => $event->slug,
                    'status' => $event->status,
                    'form_count' => $event->forms_count,
                    'response_count' => $event->response_count,
                    'created_at' => $event->created_at->format('d M Y'),
                ];
            });
        
        // Get recent responses
        $recentResponses = Respondent::with(['form.event', 'answers.question'])
            ->whereHas('form.event')
            ->orderBy('submitted_at', 'desc')
            ->take(5)
            ->get()
            ->map(function ($respondent) {
                return [
                    'id' => $respondent->id,
                    'event_title' => $respondent->form?->event?->title ?? 'Unknown',
                    'form_name' => $respondent->form?->name ?? 'Unknown',
                    'name' => $respondent->name ?? 'Anonim',
                    'submitted_at' => $respondent->submitted_at?->diffForHumans() ?? '-',
                ];
            });

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'totalEvents' => $totalEvents,
                'totalForms' => $totalForms,
                'totalResponses' => $totalResponses,
                'avgRating' => $avgRating ? round($avgRating, 1) : null,
            ],
            'recentEvents' => $recentEvents,
            'recentResponses' => $recentResponses,
        ]);
    }
}
