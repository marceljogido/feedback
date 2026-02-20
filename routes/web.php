<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\FormController as AdminFormController;
use App\Http\Controllers\Admin\UserController;
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
Route::get('/form/{slug}/spin/{token}', [FormController::class, 'spinPage'])->name('form.spin.page');
Route::post('/form/{slug}/spin', [FormController::class, 'spin'])->name('form.spin');
Route::get('/form/{slug}/edit/{token}', [FormController::class, 'edit'])->name('form.edit');
Route::put('/form/{slug}/edit/{token}', [FormController::class, 'update'])->name('form.update');

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
    Route::get('/events/{event}/edit', [EventController::class, 'edit'])->name('events.edit');
    Route::put('/events/{event}', [EventController::class, 'update'])->name('events.update');
    Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('events.destroy');
    Route::post('/events/{event}/theme-config', [EventController::class, 'updateThemeConfig'])->name('events.update-theme-config');
    
    // Event Forms
    Route::get('/events/{event}/forms', [AdminFormController::class, 'index'])->name('events.forms');
    Route::get('/events/{event}/forms/create', [AdminFormController::class, 'create'])->name('events.forms.create');
    Route::post('/events/{event}/forms', [AdminFormController::class, 'store'])->name('events.forms.store');

    // Form Management
    Route::get('/forms/{form}/edit', [AdminFormController::class, 'edit'])->name('forms.edit');
    Route::put('/forms/{form}', [AdminFormController::class, 'update'])->name('forms.update');
    Route::delete('/forms/{form}', [AdminFormController::class, 'destroy'])->name('forms.destroy');
    Route::get('/forms/{form}/builder', [AdminFormController::class, 'builder'])->name('forms.builder');
    Route::post('/forms/{form}/questions', [AdminFormController::class, 'saveQuestions'])->name('forms.questions.save');
    Route::get('/forms/{form}/responses', [AdminFormController::class, 'responses'])->name('forms.responses');
    Route::get('/forms/{form}/export-csv', [AdminFormController::class, 'exportCsv'])->name('forms.export-csv');
    Route::post('/forms/{form}/toggle-status', [AdminFormController::class, 'toggleStatus'])->name('forms.toggle-status');
    Route::delete('/forms/{form}/responses/delete-all', [AdminFormController::class, 'destroyAllResponses'])->name('forms.responses.destroy-all');
    Route::delete('/responses/{respondent}', [AdminFormController::class, 'destroyResponse'])->name('responses.destroy');
    Route::post('/forms/{form}/duplicate', [AdminFormController::class, 'duplicate'])->name('forms.duplicate');
    
    // Question Image Upload
    Route::post('/forms/upload-question-image', [AdminFormController::class, 'uploadQuestionImage'])->name('forms.upload-question-image');
    Route::post('/forms/delete-question-image', [AdminFormController::class, 'deleteQuestionImage'])->name('forms.delete-question-image');
    
    // Form Customization (Banner, Logo, Header)
    Route::post('/forms/{form}/upload-banner', [AdminFormController::class, 'uploadBanner'])->name('forms.upload-banner');
    Route::post('/forms/{form}/upload-logo', [AdminFormController::class, 'uploadLogo'])->name('forms.upload-logo');
    Route::post('/forms/{form}/update-header', [AdminFormController::class, 'updateHeader'])->name('forms.update-header');
    Route::post('/forms/{form}/update-collect-settings', [AdminFormController::class, 'updateCollectSettings'])->name('forms.update-collect-settings');

    // Spin Wheel Management
    Route::post('/forms/{form}/spin-settings', [AdminFormController::class, 'saveSpinWheelSettings'])->name('forms.spin-settings.save');
    Route::get('/forms/{form}/spin-wheel', [AdminFormController::class, 'spinWheelPage'])->name('forms.spin-wheel');
    Route::post('/forms/upload-prize-image', [AdminFormController::class, 'uploadPrizeImage'])->name('forms.upload-prize-image');
    Route::post('/forms/upload-spin-sound', [AdminFormController::class, 'uploadSpinSound'])->name('forms.upload-spin-sound');
    Route::patch('/spin-results/{spinResult}/status', [AdminFormController::class, 'updateSpinResultStatus'])->name('spin-results.update-status');

    // All Responses (separate page)
    Route::get('/responses', [EventController::class, 'allResponses'])->name('responses.index');

    // User Management
    Route::middleware('role:super_admin')->group(function () {
        Route::resource('users', UserController::class);
    });
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
