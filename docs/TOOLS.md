# Ward Tools Specification

## Overview
The Tools page provides various utilities to help users manage tasks related to ward cleaning and administration. The first tool being implemented is the Ward Contact Import Tool, which allows users to download and import member data from the Church of Jesus Christ of Latter-day Saints website.

## Ward Contact Import Tool

### Purpose
The Ward Contact Import Tool allows ward leaders to import contact information for ward members into the application. This information is used for coordinating cleaning assignments and communications.

### Data Privacy and Security
- All imported data is stored **locally** on the user's device
- Data is never shared with external parties or services
- Imported data is used only for the purposes of ward cleaning coordination
- Users will be informed about data usage and privacy practices

### User Flow
1. User navigates to the Tools page
2. User selects the Ward Contact Import Tool
3. The tool provides step-by-step instructions to:
   - Log in to churchofjesuschrist.org
   - Navigate to the Ward Directory and Map page
   - Access developer tools with Ctrl+Shift+I
   - Enter "allow pasting" in the console
   - Copy and paste the provided JavaScript code
   - Download the resulting JSON file
   - Import the downloaded file into the application
4. The application logs the import timestamp in the database
5. The application displays the date/time of the most recent import

### Technical Requirements

#### UI Components
- Instructions panel with step-by-step guidance
- Code block with syntax highlighting
- Copy button for the JavaScript code
- File upload interface for importing the downloaded JSON
- Last import timestamp display

#### Database Requirements
- Create a new `ward_data_imports` table in the Supabase database:
  ```sql
  CREATE TABLE IF NOT EXISTS ward_data_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    record_count INTEGER NOT NULL,
    import_status TEXT NOT NULL
  );
  
  -- Enable RLS on the table
  ALTER TABLE ward_data_imports ENABLE ROW LEVEL SECURITY;
  
  -- Allow users to view only their own imports
  CREATE POLICY "Users can view their own imports" 
    ON ward_data_imports 
    FOR SELECT 
    USING (auth.uid() = user_id);
  
  -- Allow users to insert their own imports
  CREATE POLICY "Users can insert their own imports" 
    ON ward_data_imports 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  ```

#### JavaScript Code to be Provided for Copy/Paste
```javascript
(function() {
  fetch('https://directory.churchofjesuschrist.org/api/v4/households?unit=2052520', {
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      const fileName = today + '.json';
      
      // Create a Blob from the JSON data
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link to trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up by removing the link and revoking the object URL
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    })
    .catch(error => console.error('Error fetching the ward directory:', error));
})();
```

### Implementation Details

#### Component Structure
1. Main Tools page: `app/tools/page.tsx`
   - Lists available tools
   - Provides navigation to individual tools

2. Ward Contact Import Tool: `app/tools/ward-contact-import/page.tsx`
   - Contains instructions, code block, file upload, and import history

#### Data Storage and Processing
1. When a user imports a ward contact list:
   - Validate the JSON structure
   - Store import metadata in the `ward_data_imports` table
   - Process the contact data for use in the application

2. Import metadata logging:
   - User ID (to track who performed the import)
   - Import timestamp
   - Number of records imported
   - Import status (success/error)

#### Error Handling
- Provide clear error messages for invalid JSON files
- Handle network errors during file upload
- Validate file size and content type

## Future Tools
Additional tools to be added in future iterations:
- Ward Map Utility
- Cleaning Assignment Generator
- Meeting Scheduler
- Email/SMS Communication Tool 