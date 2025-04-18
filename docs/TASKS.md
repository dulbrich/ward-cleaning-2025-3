### New Tables

#### cleaning_sessions
This new table represents individual cleaning events:

```sql
CREATE TABLE IF NOT EXISTS cleaning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_branch_id UUID NOT NULL REFERENCES ward_branches(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES cleaning_schedules(id) ON DELETE SET NULL,
  session_name TEXT NOT NULL,
  session_date DATE NOT NULL,
  public_access_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT
);

-- Enable RLS on the table
ALTER TABLE cleaning_sessions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view sessions they created or for wards they belong to
CREATE POLICY "Users can view cleaning sessions for their wards" 
  ON cleaning_sessions 
  FOR SELECT 
  USING (
    ward_branch_id IN (
      SELECT id FROM ward_branches WHERE user_id = auth.uid()
    ) OR
    created_by = auth.uid()
  );

-- Allow authenticated users to insert sessions for wards they belong to
CREATE POLICY "Users can insert cleaning sessions for their wards" 
  ON cleaning_sessions 
  FOR INSERT 
  WITH CHECK (
    ward_branch_id IN (
      SELECT id FROM ward_branches WHERE user_id = auth.uid()
    )
  );

-- Allow authenticated users to update sessions they created or for wards they belong to
CREATE POLICY "Users can update their cleaning sessions" 
  ON cleaning_sessions 
  FOR UPDATE 
  USING (
    ward_branch_id IN (
      SELECT id FROM ward_branches WHERE user_id = auth.uid()
    ) OR
    created_by = auth.uid()
  );

-- Allow authenticated users to delete sessions they created
CREATE POLICY "Users can delete their cleaning sessions" 
  ON cleaning_sessions 
  FOR DELETE 
  USING (
    created_by = auth.uid()
  );

-- Allow public access to sessions with the correct access code
CREATE POLICY "Public access to cleaning sessions with access code" 
  ON cleaning_sessions 
  FOR SELECT 
  USING (
    status = 'active'
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cleaning_sessions_ward_branch_id ON cleaning_sessions(ward_branch_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_sessions_public_access_code ON cleaning_sessions(public_access_code);
```

## Core Functionality

### Real-time Updates
- WebSocket implementation to provide instant updates to all users
- Updates sync across all connected devices without page refresh

### Session Creation Flow
1. User accesses the Tasks page
2. User clicks "Create New Cleaning Session" button
3. Form appears with the following fields:
   - Session Name (text input)
   - Scheduled Cleaning (dropdown selection from cleaning_schedules table)
   - Manual Date Selection (date picker, enabled only if no schedule is selected)
4. When a scheduled cleaning is selected from the dropdown:
   - The date is automatically populated from the schedule's cleaning_date
   - The assigned group is displayed
5. System generates a unique public access code for the session
6. Tasks from the ward_tasks table are automatically added to the session

### Task Assignment Flow 

## User Interface

### Views
- **Kanban View**: Tasks organized in columns by status (To Do, Doing, Done)
- **List View**: Tasks displayed in a linear format with status indicators
- **Toggle**: Users can switch between these views via a toggle control

### Task Cards
- Display task title, description, estimated time, due date
- Status badge (To Do, Doing, Done)
- Visual indicator for assigned tasks showing assignee's avatar

### Task Detail View
- Accessed by clicking on a task card
- Shows complete task information including:
  - Title, description, estimated time, due date
  - Current status
  - Real-time view of user avatars (stacked circles) showing all users currently viewing the task
  - Action buttons based on task state

### Session Creation Modal
- Clean, intuitive form for creating a new cleaning session
- Components:
  - Session Name field (text input)
  - Scheduled Cleaning dropdown:
    - Lists upcoming cleaning events from the cleaning_schedules table
    - Format: "[Date] [Time] - [Assigned Group]" (e.g., "Apr 19, 2025 9:00 AM - Group C")
    - Sorted by date with the nearest upcoming events at the top
    - Option for "Custom Date" at the bottom of the dropdown
  - Date and Time picker (enabled only if "Custom Date" is selected or no schedule is chosen)
  - Create Session button
  - Cancel button 