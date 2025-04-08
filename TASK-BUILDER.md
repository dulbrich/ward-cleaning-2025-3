# Task Builder Specification

## Overview

The Task Builder is a feature that allows administrators to create cleaning tasks from templates. These templates are based on the standard cleaning tasks documented in "cleaning-cards-5x7-v4.pdf" and include detailed information needed for ward members to complete building cleaning tasks.

## Objectives

- Enable admins to create tasks from pre-existing templates
- Allow customization of task details with a user-friendly interface
- Support adding images to tasks
- Provide full CRUD (Create, Read, Update, Delete) operations for ward tasks
- Integrate with the existing ward structure in the application

## User Interface Design

### Integration with Tools Page

The Task Builder will be integrated into the existing Tools page, accessible through the sidebar navigation. The implementation will match the design patterns established in the current application.

### Main Components

#### 1. Task List View

![Task List View Mockup]

- Table/card view of all tasks for the selected ward
- Sortable columns (title, created date, etc.)
- Search and filter capabilities
- Add Task button (prominently displayed)
- Edit/Delete actions for each task
- Task status indicator (active/inactive)
- Color indicator for each task (based on assigned color)

#### 2. Template Selection Modal

![Template Selection Modal Mockup]

- Grid layout of available task templates
- Each template card shows:
  - Title
  - Brief preview of instructions
  - Select button
- Search/filter options for finding specific templates
- Categories or tags for organization (optional)
- Preview functionality to view full template details

#### 3. Task Edit Form

![Task Edit Form Mockup]

- Form with the following fields:
  - Title (required)
  - Subtitle (optional)
  - Instructions (WYSIWYG editor)
  - Equipment (WYSIWYG editor)
  - Safety Guidelines (WYSIWYG editor)
  - Image Upload/Selection
  - Color Selector (for color-coding tasks)
- Save/Cancel buttons
- Form validation with helpful error messages
- Pre-filled with template data when coming from template selection

### User Flow

1. Admin navigates to Tools > Task Builder
2. Views list of existing tasks for their ward
3. Clicks "Add Task" button
4. Selects from available templates
5. Edits pre-filled form with task details
   - Can modify any field
   - Can add images
   - Can add a subtitle
   - Can select a color for the task
6. Saves the task to add it to ward tasks
7. The new task appears in the task list

For editing existing tasks:
1. Admin selects "Edit" on a task from the list
2. Modifies details in the task edit form
3. Saves changes

For deleting tasks:
1. Admin selects "Delete" on a task from the list
2. Confirms deletion in a confirmation dialog
3. Task is removed from the list

## Database Design

### Schema

#### 1. task_templates Table

| Column      | Type         | Constraints      | Description                         |
|-------------|--------------|------------------|-------------------------------------|
| id          | uuid         | PK               | Unique identifier                   |
| title       | varchar(255) | NOT NULL         | Template title                      |
| instructions| text         | NOT NULL         | Task instructions (rich text)       |
| equipment   | text         | NOT NULL         | Required equipment (rich text)      |
| safety      | text         |                  | Safety guidelines (rich text)       |
| category    | varchar(100) |                  | Category for organization           |
| created_at  | timestamp    | NOT NULL         | Creation timestamp                  |
| updated_at  | timestamp    | NOT NULL         | Last update timestamp               |

#### 2. ward_tasks Table

| Column      | Type         | Constraints       | Description                         |
|-------------|--------------|-------------------|-------------------------------------|
| id          | uuid         | PK                | Unique identifier                   |
| ward_id     | uuid         | FK, NOT NULL      | References ward_branches.id         |
| template_id | uuid         | FK                | References task_templates.id        |
| title       | varchar(255) | NOT NULL          | Task title                          |
| subtitle    | varchar(255) |                   | Optional subtitle                   |
| instructions| text         | NOT NULL          | Task instructions (rich text)       |
| equipment   | text         | NOT NULL          | Required equipment (rich text)      |
| safety      | text         |                   | Safety guidelines (rich text)       |
| image_url   | varchar(255) |                   | URL to task image                   |
| color       | varchar(50)  |                   | Color code for task                 |
| active      | boolean      | NOT NULL, DEFAULT true | Task status                    |
| created_at  | timestamp    | NOT NULL          | Creation timestamp                  |
| updated_at  | timestamp    | NOT NULL          | Last update timestamp               |
| created_by  | uuid         | FK, NOT NULL      | User who created the task           |

### Relationships

- Each `ward_tasks` record optionally references a `task_templates` record
- Each `ward_tasks` record references a ward from the `ward_branches` table
- Each `ward_tasks` record references the creating user

### SQL for Table Creation

```sql
-- Create task_templates table
CREATE TABLE IF NOT EXISTS task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    instructions TEXT NOT NULL,
    equipment TEXT NOT NULL,
    safety TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create ward_tasks table
CREATE TABLE IF NOT EXISTS ward_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ward_id UUID NOT NULL REFERENCES ward_branches(id) ON DELETE CASCADE,
    template_id UUID REFERENCES task_templates(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    instructions TEXT NOT NULL,
    equipment TEXT NOT NULL,
    safety TEXT,
    image_url VARCHAR(255),
    color VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT
);

-- Create indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_ward_tasks_ward_id ON ward_tasks(ward_id);
CREATE INDEX IF NOT EXISTS idx_ward_tasks_active ON ward_tasks(active);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to task_templates
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON task_templates
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Apply trigger to ward_tasks
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON ward_tasks
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Add RLS (Row Level Security) policies
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_tasks ENABLE ROW LEVEL SECURITY;

-- Policy for task_templates (all authenticated users can view)
CREATE POLICY "Task templates are viewable by all authenticated users"
ON task_templates FOR SELECT
TO authenticated
USING (true);

-- Policies for ward_tasks
-- Users can view tasks for wards they own
CREATE POLICY "Users can view tasks for wards they own"
ON ward_tasks FOR SELECT
TO authenticated
USING (
  -- Check if user is the owner of the ward
  EXISTS (
    SELECT 1 FROM ward_branches
    WHERE ward_branches.id = ward_tasks.ward_id
    AND ward_branches.user_id = auth.uid()
  )
);

-- Only the ward owner can insert tasks
CREATE POLICY "Only ward owners can insert tasks"
ON ward_tasks FOR INSERT
TO authenticated
WITH CHECK (
  -- Check if user is the owner of the ward
  EXISTS (
    SELECT 1 FROM ward_branches
    WHERE ward_branches.id = ward_tasks.ward_id
    AND ward_branches.user_id = auth.uid()
  )
);

-- Only the ward owner can update tasks
CREATE POLICY "Only ward owners can update tasks"
ON ward_tasks FOR UPDATE
TO authenticated
USING (
  -- Check if user is the owner of the ward
  EXISTS (
    SELECT 1 FROM ward_branches
    WHERE ward_branches.id = ward_tasks.ward_id
    AND ward_branches.user_id = auth.uid()
  )
)
WITH CHECK (
  -- Check if user is the owner of the ward
  EXISTS (
    SELECT 1 FROM ward_branches
    WHERE ward_branches.id = ward_tasks.ward_id
    AND ward_branches.user_id = auth.uid()
  )
);

-- Only the ward owner can delete tasks
CREATE POLICY "Only ward owners can delete tasks"
ON ward_tasks FOR DELETE
TO authenticated
USING (
  -- Check if user is the owner of the ward
  EXISTS (
    SELECT 1 FROM ward_branches
    WHERE ward_branches.id = ward_tasks.ward_id
    AND ward_branches.user_id = auth.uid()
  )
);
```

## Data Import Strategy

### Template Data from PDF

The cleaning tasks templates from "cleaning-cards-5x7-v4.pdf" need to be imported into the database. Since PDFs aren't easily machine-readable in a structured way, the following approach is recommended:

1. Manual Extraction:
   - Create a structured JSON file representing all tasks from the PDF
   - Include title, instructions, equipment, and safety information for each task
   - Example format:
     ```json
     [
       {
         "title": "Clean Glass Entrance Doors",
         "instructions": "1. Spray glass cleaner on the glass surface.\n2. Wipe with a lint-free cloth until clean and streak-free.\n3. Clean both sides of the door glass.\n4. Wipe door handles and push bars with disinfectant.",
         "equipment": "Glass cleaner, lint-free cloths, disinfectant spray",
         "safety": "Ensure wet floor signs are visible if using spray that could make floor slippery."
       },
       // Additional templates...
     ]
     ```

2. Database Migration:
   - Create a migration script that reads the JSON file
   - Insert records into the `task_templates` table
   - Handle potential duplicates by checking for existing titles

3. Implementation Steps:
   - Extract data manually from PDF to JSON (one-time process)
   - Develop migration script to seed the database
   - Run migration during deployment
   - Verify data import with QA process

## Implementation Details

### Frontend Components

1. Task List Component:
   - React component for displaying ward tasks
   - Supports sorting, filtering, and pagination
   - Includes action buttons for CRUD operations
   - Color indicators for tasks

2. Template Selection Component:
   - Modal dialog showing available templates
   - Grid or list view with search/filter functionality
   - Template preview capability

3. Task Edit Component:
   - Form with field validation
   - WYSIWYG editors for rich text fields
   - Image upload with preview
   - Color picker for selecting task color
   - Submit and cancel actions

### Backend Implementation

1. API Endpoints:
   - GET /api/tasks - List tasks for current ward
   - GET /api/tasks/:id - Get task details
   - POST /api/tasks - Create new task
   - PUT /api/tasks/:id - Update existing task
   - DELETE /api/tasks/:id - Delete or deactivate task
   - GET /api/task-templates - List available templates
   - GET /api/task-templates/:id - Get template details

2. Controllers/Services:
   - TaskController for handling API requests
   - TaskService for business logic
   - TemplateService for template-related operations

3. Authentication & Authorization:
   - Middleware to ensure only admins can modify tasks
   - Permission checks in controllers

### Image Handling

1. Upload Process:
   - Client-side image preview
   - Image optimization before upload
   - Secure upload to Supabase Storage

2. Storage:
   - Dedicated bucket for task images
   - Organized by ward ID for easy management
   - Access controls to prevent unauthorized access

3. Specifications:
   - Max image size: 2MB
   - Accepted formats: JPG, PNG, WebP
   - Automatic resizing to:
     - Thumbnail: 200x200px
     - Display: 800px max width

### Color Handling

1. Color Selection:
   - Predefined color palette for consistency
   - Color picker component
   - Ability to preview task with selected color

2. Color Usage:
   - Visual indicator in task list
   - Optional color-coding in user interfaces
   - Color value stored as hex code or named color

### Rich Text Handling

1. WYSIWYG Editor:
   - TipTap or similar React-based editor
   - Supported formatting:
     - Basic formatting (bold, italic, underline)
     - Lists (bulleted, numbered)
     - Links
     - Simple tables

2. Storage Format:
   - HTML or JSON structure (based on chosen editor)
   - Sanitization to prevent XSS attacks
   - Consistent rendering between edit and view modes

## Technical Considerations

### Performance

1. Optimizations:
   - Pagination for template list
   - Lazy loading for images
   - Debounced search for filtering
   - Optimistic UI updates for better UX

2. Caching:
   - Cache templates to reduce database queries
   - Use SWR or React Query for data fetching

### Security

1. Data Validation:
   - Server-side validation for all inputs
   - Sanitization of rich text content
   - Image validation for size and format

2. Authorization:
   - Role-based access control
   - Row-level security in database
   - Audit logging for sensitive operations

### Testing Strategy

1. Unit Tests:
   - Component tests for UI elements
   - Service tests for business logic

2. Integration Tests:
   - API endpoint tests
   - Database operation tests

3. User Testing:
   - Workflow validation
   - Usability testing

## Future Extensions

1. Enhanced Features:
   - Task categories and tags
   - Task scheduling capability
   - Task assignment to specific users
   - Task completion tracking
   - Rating/feedback system for tasks

2. Additional Functionality:
   - Task template management UI for admins
   - Import/export of task templates
   - Version history for tasks
   - Task dependency relationships

## Timeline and Priorities

1. Phase 1 (MVP):
   - Database setup
   - Template import from JSON
   - Basic CRUD operations for tasks
   - Simple task edit form

2. Phase 2:
   - WYSIWYG editor integration
   - Image upload functionality
   - Improved task list with sorting/filtering

3. Phase 3:
   - UI refinements
   - Additional features from future extensions list

## Conclusion

This Task Builder specification outlines a comprehensive approach to implementing a feature that allows administrators to create and manage cleaning tasks from templates. The design aligns with existing application patterns while providing a robust foundation for future enhancements.

The implementation should prioritize user experience, making it easy for administrators to quickly create and modify tasks while ensuring the resulting task information is clear and helpful for ward members performing the cleaning activities.
