<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\FormController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public Routes (Form)
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/form/{slug}', [FormController::class, 'show'])->name('form.show');
Route::post('/form/{slug}', [FormController::class, 'submit'])->name('form.submit');
Route::get('/form/{slug}/thankyou', [FormController::class, 'thankyou'])->name('form.thankyou');

/*
|--------------------------------------------------------------------------
| Admin Routes (Authenticated)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard.index');

    // Events
    Route::get('/events', [EventController::class, 'index'])->name('events.index');
    Route::get('/events/create', [EventController::class, 'create'])->name('events.create');
    Route::post('/events', [EventController::class, 'store'])->name('events.store');
    Route::get('/events/{event}/edit', [EventController::class, 'edit'])->name('events.edit'); // Settings only
    Route::put('/events/{event}', [EventController::class, 'update'])->name('events.update');
    Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('events.destroy');
    
    // Form Builder
    Route::get('/events/{event}/builder', [EventController::class, 'builder'])->name('events.builder');
    Route::post('/events/{event}/questions', [EventController::class, 'saveQuestions'])->name('events.questions.save');
    Route::get('/events/{event}/responses', [EventController::class, 'responses'])->name('events.responses');
    Route::post('/events/{event}/toggle-status', [EventController::class, 'toggleStatus'])->name('events.toggle-status');

    // Forms (separate page)
    Route::get('/forms', [EventController::class, 'forms'])->name('forms.index');

    // All Responses (separate page)
    Route::get('/responses', [EventController::class, 'allResponses'])->name('responses.index');
});

/*
|--------------------------------------------------------------------------
| Profile Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
