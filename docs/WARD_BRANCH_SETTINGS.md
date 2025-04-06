# Ward/Branch Settings Specification

## Overview
This document specifies the implementation of the Ward/Branch Settings tab in the application. This feature allows users to manage (Create, Read, Update, Delete) LDS church wards and branches that they are associated with. The settings provide a way for users to organize and maintain their church unit information for use in other parts of the application.

## Purpose
- Enable users to manage their associated LDS church wards and branches
- Store ward/branch information in a structured format
- Allow users to designate a primary/default ward or branch
- Support membership in multiple wards/branches
- Maintain a clean, user-friendly interface consistent with existing design
- Provide a foundation for ward/branch-specific features in other parts of the application

## User Interface
The Ward/Branch Settings tab provides the following components:

### Ward/Branch List View
- Displays a list of all wards/branches the user has added
- Shows ward/branch name, unit number, and location information
- Indicates which ward/branch is set as primary/default
- Provides action buttons for edit and delete operations
- Includes a "Add New Ward/Branch" button at the top

### Add/Edit Ward/Branch Form
- Form fields for entering ward/branch information
- Validation for required fields
- Save and Cancel buttons
- Option to set as primary/default ward/branch

## Field Requirements

### Ward/Branch Name
- Required field
- Text input
- Maximum length: 100 characters
- Examples: "Grasslands 3rd Ward", "Springville Branch"

### Unit Type
- Required field
- Select dropdown
- Options: "Ward", "Branch"

### Unit Number
- Optional field
- Numeric input
- Maximum length: 10 characters
- Validation: Numeric characters only

### Stake/District Name
- Optional field
- Text input
- Maximum length: 100 characters
- Examples: "Provo Utah Stake", "Santiago Chile District"

### Location
- Optional fields
- City: Text input, maximum length 100 characters
- State/Province: Text input, maximum length 100 characters
- Country: Text input, maximum length 100 characters

### Is Primary
- Boolean toggle
- When set to true, automatically sets other wards/branches to false
- Default: First ward/branch added is set to primary

## Data Persistence

### Database Schema
Create a new `ward_branches` table in the Supabase database:

```sql
CREATE TABLE IF NOT EXISTS ward_branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  unit_type VARCHAR(10) NOT NULL CHECK (unit_type IN ('Ward', 'Branch')),
  unit_number VARCHAR(10),
  stake_district_name VARCHAR(100),
  city VARCHAR(100),
  state_province VARCHAR(100),
  country VARCHAR(100),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_ward_branches_user_id ON ward_branches(user_id);

-- Enable RLS on the table
ALTER TABLE ward_branches ENABLE ROW LEVEL SECURITY;

-- Allow users to view only their own ward/branch entries
CREATE POLICY "Users can view their own ward/branch entries" 
  ON ward_branches 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert their own ward/branch entries
CREATE POLICY "Users can insert their own ward/branch entries" 
  ON ward_branches 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own ward/branch entries
CREATE POLICY "Users can update their own ward/branch entries" 
  ON ward_branches 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to delete their own ward/branch entries
CREATE POLICY "Users can delete their own ward/branch entries" 
  ON ward_branches 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create Function to handle updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_ward_branches_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatically updating the updated_at timestamp
CREATE TRIGGER update_ward_branches_modtime
BEFORE UPDATE ON ward_branches
FOR EACH ROW
EXECUTE FUNCTION update_ward_branches_updated_at();

-- Create Function to handle primary ward/branch logic
CREATE OR REPLACE FUNCTION maintain_single_primary_ward_branch() 
RETURNS TRIGGER AS $$
BEGIN
    -- If new record is marked as primary, unmark all others for this user
    IF NEW.is_primary = TRUE THEN
        UPDATE ward_branches
        SET is_primary = FALSE
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    
    -- Ensure at least one ward/branch is primary if this is the only record
    IF (SELECT COUNT(*) FROM ward_branches WHERE user_id = NEW.user_id) = 1 THEN
        NEW.is_primary = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for primary ward/branch logic
CREATE TRIGGER ensure_single_primary_ward_branch
BEFORE INSERT OR UPDATE ON ward_branches
FOR EACH ROW
EXECUTE FUNCTION maintain_single_primary_ward_branch();
```

## API Endpoints

### GET `/api/ward-branches`
Retrieves all ward/branches for the current user.

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Grasslands 3rd Ward",
      "unit_type": "Ward",
      "unit_number": "2052520",
      "stake_district_name": "Springville Utah Stake",
      "city": "Springville",
      "state_province": "Utah",
      "country": "United States",
      "is_primary": true,
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z"
    },
    ...
  ]
}
```

### POST `/api/ward-branches`
Creates a new ward/branch entry.

Request:
```json
{
  "name": "Grasslands 3rd Ward",
  "unit_type": "Ward",
  "unit_number": "2052520",
  "stake_district_name": "Springville Utah Stake",
  "city": "Springville",
  "state_province": "Utah",
  "country": "United States",
  "is_primary": true
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Grasslands 3rd Ward",
    "unit_type": "Ward",
    "unit_number": "2052520",
    "stake_district_name": "Springville Utah Stake",
    "city": "Springville",
    "state_province": "Utah",
    "country": "United States",
    "is_primary": true,
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  }
}
```

### PUT `/api/ward-branches/:id`
Updates an existing ward/branch entry.

Request:
```json
{
  "name": "Grasslands 3rd Ward Updated",
  "unit_type": "Ward",
  "unit_number": "2052520",
  "stake_district_name": "Springville Utah Stake",
  "city": "Springville",
  "state_province": "Utah",
  "country": "United States",
  "is_primary": true
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Grasslands 3rd Ward Updated",
    "unit_type": "Ward",
    "unit_number": "2052520",
    "stake_district_name": "Springville Utah Stake",
    "city": "Springville",
    "state_province": "Utah",
    "country": "United States",
    "is_primary": true,
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T01:00:00.000Z"
  }
}
```

### DELETE `/api/ward-branches/:id`
Deletes a ward/branch entry.

Response:
```json
{
  "success": true,
  "message": "Ward/Branch deleted successfully"
}
```

### PUT `/api/ward-branches/:id/set-primary`
Sets a ward/branch as the primary/default.

Response:
```json
{
  "success": true,
  "message": "Ward/Branch set as primary successfully"
}
```

## Implementation Notes

### Form Validation
- Client-side validation ensures all required fields are properly filled
- Server-side validation ensures data integrity before storing in the database
- Toast notifications inform users of successful actions or errors

### Primary Ward/Branch Logic
- Only one ward/branch can be designated as primary at a time
- When a new primary is designated, the previous primary is automatically updated
- If there's only one ward/branch, it's automatically set as primary
- If the primary ward/branch is deleted, another ward/branch is automatically set as primary

### State Management
- React state hooks manage form data and user interactions
- API requests handle data persistence
- Form reset functionality clears the form after submission or cancellation

### UI Components
- Use of Shadcn UI components for consistent styling
- Responsive design for mobile and desktop views
- Accessible form elements with proper labels and ARIA attributes

## Dependencies
- React: For component rendering and state management
- Next.js: For API routes and server-side rendering
- Supabase: For data storage and authentication
- Shadcn UI: For consistent styling and UI components
- React Hook Form: For form validation and submission
- Zod: For schema validation
- Sonner: For toast notifications

## Error Handling
- Form validation errors are displayed inline next to the relevant fields
- API errors display a toast notification with a meaningful error message
- Network errors are handled gracefully with retry options
- Unexpected errors are logged for troubleshooting

## Future Enhancements
1. Integration with LDS Church API for ward/branch verification
2. Bulk import of ward/branch data
3. Support for hierarchical organization (Stake > Ward > Class/Quorum)
4. Map visualization of ward/branch locations
5. Sharing ward/branch data between users with appropriate permissions
6. Integration with calendar events specific to wards/branches 