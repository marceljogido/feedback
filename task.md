# Multi-Form per Event Feature

## Tasks

### Backend
- [x] Create migration for `forms` table
- [x] Create `Form` model with relationships
- [x] Update `FormQuestion` model (change event_id to form_id)
- [x] Update `Respondent` model (change event_id to form_id)
- [x] Create `FormController` for admin (CRUD forms)
- [x] Update `EventController` to handle forms
- [x] Update public `FormController` to use form slug

### Frontend
- [x] Create `Admin/Events/Forms.tsx` (list forms per event)
- [x] Create `Admin/Forms/Create.tsx` (create form for event)
- [x] Create `Admin/Forms/Edit.tsx` (edit form settings)
- [x] Update `Admin/Events/Index.tsx` (show form count)
- [x] Create `Admin/Forms/FormBuilder.tsx` (form builder)
- [x] Create `Admin/Forms/Responses.tsx` (view responses)
- [x] Create `Admin/Forms/Responses.tsx` (view responses)
- [x] Update routes in `web.php`
- [x] Implement QR Code Generation


### Image Support
- [x] Add `image` column to `form_questions`
- [x] Backend upload endpoint for questions
- [x] Frontend support for question images
- [x] Frontend support for multiple choice option images (Admin)
- [x] Frontend support for multiple choice option images (Public)
- [ ] Backend validation update for complex options structure

### Database Migration
- [x] Run migration
- [x] Migrate existing data (if any)

### Testing
- [ ] Test form creation
- [ ] Test form builder
- [ ] Test public form submission
- [ ] Test responses viewing
