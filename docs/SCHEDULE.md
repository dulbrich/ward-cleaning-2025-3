# Building Cleaning Schedule Specification

## Overview
This document specifies the implementation of the Schedule tab in the application. The primary purpose of this feature is to create and manage schedules for ward building cleanings by selecting date ranges and assigning groups to Saturdays. The schedule feature provides various viewing options and helps ward leaders organize cleaning assignments efficiently.

## Purpose
- Enable users to create and manage cleaning schedules for their ward buildings
- Automatically assign groups to Saturdays based on simple user inputs
- Support multiple wards/branches with separate schedules
- Provide multiple viewing options (list, calendar, text/email)
- Display participants for each cleaning day
- Allow customization of cleaning times

## User Interface Components

### Ward Selection
- Dropdown to select between multiple wards/branches (if user has more than one)
- Only appears if the user has multiple wards/branches

### Schedule Configuration
- Date range selector to specify which months the ward is responsible for cleaning
- Default cleaning time input (defaults to 9:00 AM)
- Button to generate/update schedule

### View Selection
- Toggle between different views:
  - Calendar View: Monthly calendar showing all scheduled cleanings
  - List View: Chronological list of all scheduled cleanings
  - Text/Email View: Formatted text suitable for copying to emails/messages

### Schedule Display
- Shows all scheduled cleaning days with:
  - Date and time
  - Assigned group(s)
  - List of participants (excluding those in do_not_contact table)
- Edit button to modify individual cleaning days

### Edit Cleaning Dialog
- Form to modify date, time, and assigned group for a specific cleaning day
- Save and Cancel buttons

## User Data Integration

### Data Sources
The schedule feature integrates with several existing data sources:

1. **wardContactData** (localStorage)
   - JSON data imported from ward exports (ward.json)
   - Contains household and member information
   - Primary source for participant names and contact details
   - Stored structure includes households with members, each containing:
     - name/displayName
     - phone information
     - positions
     - head (boolean)

2. **user_profiles** (database table)
   - Contains information about registered application users
   - Links to auth.users table for authentication

3. **anonymous_users** (database table)
   - Tracks both imported contacts and registered users
   - Structure:
     ```sql
     id UUID PRIMARY KEY
     user_hash TEXT UNIQUE NOT NULL
     user_type TEXT NOT NULL DEFAULT 'imported'
     registered_user_id UUID REFERENCES auth.users(id)
     unit_number CHARACTER VARYING
     ```
   - Provides mapping between imported contacts and registered users
   - The hash ties anonymous (imported) users to registered users

4. **do_not_contact** (database table)
   - Stores hashed identifiers of users who should not be contacted
   - Structure:
     ```sql
     id UUID PRIMARY KEY
     user_hash TEXT NOT NULL
     marked_by UUID
     marked_at TIMESTAMP WITH TIME ZONE
     ```
   - Used to filter out members from participant lists

### Hashing Mechanism
The application uses a hashing mechanism to create consistent identifiers for ward members:

1. **Hash Generation**
   - Created from member data when importing ward.json
   - Uses a combination of name, phone, and/or email
   - Ensures the same person gets the same hash across imports
   - Used to track imported contacts before they register

2. **User Identification Flow**
   - When displaying participants:
     1. Retrieve members from wardContactData
     2. Generate a hash for each member
     3. Check if hash exists in anonymous_users
     4. If registered_user_id is present, link to user_profiles
     5. Check if hash exists in do_not_contact (to exclude)

3. **Participant Filtering Process**
   - Group members by last name first letter
   - Generate hash for each member
   - Query do_not_contact table to exclude flagged members
   - For each remaining member:
     - Check anonymous_users to determine if registered
     - Display appropriate contact information based on status

### Implementation Details
When implementing the participant list functionality:

1. **Processing wardContactData**
   - Parse the JSON structure to extract member information
   - Group by last name's first letter (A-F, G-L, M-R, S-Z)
   - For each member, generate a user hash using the same algorithm used in the import process

2. **Checking do_not_contact status**
   - Query the do_not_contact table with the generated hashes
   - Exclude any members whose hash appears in the results

3. **Determining user type**
   - Query the anonymous_users table with the generated hashes
   - For matches:
     - If user_type = 'registered' and registered_user_id is present:
       - Use user_profiles data for display
     - If user_type = 'imported':
       - Use wardContactData information for display

4. **Displaying contact information**
   - For registered users: Follow privacy preferences from user_profiles
   - For imported users: Display based on wardContactData

### Participants Batch Processing
To optimize performance when generating schedules:

1. Extract all potential participants from wardContactData
2. Generate hashes for all members in a single batch
3. Query anonymous_users and do_not_contact tables with all hashes at once
4. Process the results to create filtered group assignments
5. Store these assignments with the schedule for quick retrieval

## Functionality Requirements

### Group Assignment Logic
- Ward members are divided into 4 groups based on the first letter of last name
- For a month where the ward is responsible for cleaning:
  - Each group is assigned to one Saturday (Group A - 1st Saturday, Group B - 2nd Saturday, etc.)
  - If there is a 5th Saturday in a month, the entire ward is assigned to that day

### Schedule Generation
1. User selects month(s) the ward is responsible for cleaning
2. User sets default cleaning time (defaults to 9:00 AM)
3. System identifies all Saturdays within the selected months
4. System assigns groups to Saturdays following the assignment logic
5. Schedule is generated and displayed

### Schedule Modification
- Users can modify the time for any scheduled cleaning day after generation
- Users can manually override group assignments if needed

### Ward Member Integration
- System retrieves ward member data from wardContactData in localStorage
- Participants are grouped by the first letter of their last name
- Members in the do_not_contact table are excluded from participant lists

### Multi-Ward Support
- If a user has multiple wards in the ward_branches table, they can switch between ward schedules
- Each ward maintains its own independent schedule

## Data Models

### Schedule Table
```sql
CREATE TABLE IF NOT EXISTS cleaning_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ward_branch_id UUID NOT NULL REFERENCES ward_branches(id) ON DELETE CASCADE,
  cleaning_date DATE NOT NULL,
  cleaning_time TIME NOT NULL DEFAULT '09:00:00',
  assigned_group TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ward_branch_id, cleaning_date)
);

-- Enable RLS on the table
ALTER TABLE cleaning_schedules ENABLE ROW LEVEL SECURITY;

-- Allow users to view schedules for wards they belong to
CREATE POLICY "Users can view cleaning schedules" 
  ON cleaning_schedules 
  FOR SELECT 
  USING (
    ward_branch_id IN (
      SELECT id FROM ward_branches WHERE user_id = auth.uid()
    )
  );

-- Allow users to insert schedules for wards they belong to
CREATE POLICY "Users can insert cleaning schedules" 
  ON cleaning_schedules 
  FOR INSERT 
  WITH CHECK (
    ward_branch_id IN (
      SELECT id FROM ward_branches WHERE user_id = auth.uid()
    )
  );

-- Allow users to update schedules for wards they belong to
CREATE POLICY "Users can update cleaning schedules" 
  ON cleaning_schedules 
  FOR UPDATE 
  USING (
    ward_branch_id IN (
      SELECT id FROM ward_branches WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete schedules for wards they belong to
CREATE POLICY "Users can delete cleaning schedules" 
  ON cleaning_schedules 
  FOR DELETE 
  USING (
    ward_branch_id IN (
      SELECT id FROM ward_branches WHERE user_id = auth.uid()
    )
  );

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_cleaning_schedules_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cleaning_schedules_modtime
BEFORE UPDATE ON cleaning_schedules
FOR EACH ROW
EXECUTE FUNCTION update_cleaning_schedules_updated_at();
```

## API Endpoints

### GET `/api/cleaning-schedules`
- Retrieves all cleaning schedules for a specific ward/branch
- Query parameters: `ward_branch_id`, `start_date`, `end_date`
- Returns: List of cleaning schedule entries

### POST `/api/cleaning-schedules/generate`
- Generates a new schedule based on specified parameters
- Request body:
  ```json
  {
    "ward_branch_id": "uuid",
    "months": ["2025-04", "2025-05"],
    "default_time": "09:00:00"
  }
  ```
- Returns: Generated schedule entries

### PUT `/api/cleaning-schedules/:id`
- Updates a specific cleaning schedule entry
- Request body:
  ```json
  {
    "cleaning_time": "10:00:00",
    "assigned_group": "Group A"
  }
  ```
- Returns: Updated schedule entry

### DELETE `/api/cleaning-schedules/:id`
- Deletes a specific cleaning schedule entry
- Returns: Success message

## Display Views

### Calendar View
- Monthly calendar showing all cleaning days
- Color-coded by assigned group
- Hover or click for additional details

### List View
- Chronological list of all cleaning days
- Each entry shows:
  - Date (formatted as "Saturday, April 5, 2025")
  - Time
  - Assigned group
  - Expandable list of participants

### Text/Email View
- Formatted text suitable for copying to email or messages
- Includes all essential information
- "Copy to Clipboard" button
- Preview of how the text will appear

## Member Grouping Logic

### Group Assignment
- Group A: Last names starting with A-F
- Group B: Last names starting with G-L
- Group C: Last names starting with M-R
- Group D: Last names starting with S-Z
- Whole Ward: All members for 5th Saturdays

### Participant List
- For each cleaning day, retrieve and display the list of ward members in the assigned group
- Exclude members who are in the do_not_contact table
- Sort by last name
- Display name and phone number

## Implementation Notes
- Use React state management to handle schedule data
- Implement date manipulation with a library like date-fns
- Use a calendar component for the calendar view
- Implement responsive design for mobile compatibility
- Cache schedule data for performance
- Implement error handling for all API requests
- Add loading states for async operations 