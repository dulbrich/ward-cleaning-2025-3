# Contacts Page Specification

## Overview
This document specifies enhancements to the Contacts page to enable users to mark ward members as "do not contact." This functionality helps ward leaders and members respect privacy preferences and ensures members who do not wish to be contacted are easily identifiable in the system.

## Purpose
- Display a list of ward members with their contact information
- Allow users to mark/unmark individuals as "do not contact"
- Clearly indicate which members should not be contacted
- Distinguish between imported users and registered users
- Store "do not contact" preferences in the database
- Maintain mobile-friendly UI consistent with existing design

## User Types Display
The Contacts page will indicate the type of user:
1. **Imported User**: A ward member whose information was imported using the Ward Contact Import Tool
2. **Registered User**: A ward member who has created their own account

## Database Requirements

### Do Not Contact Table
Create a new `do_not_contact` table in the Supabase database:

```sql
CREATE TABLE IF NOT EXISTS do_not_contact (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_hash TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  marked_by UUID REFERENCES auth.users(id),
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the table
ALTER TABLE do_not_contact ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view do not contact records
CREATE POLICY "Authenticated users can view do not contact list" 
  ON do_not_contact 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert/update do not contact records
CREATE POLICY "Authenticated users can insert do not contact records" 
  ON do_not_contact 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update do not contact records" 
  ON do_not_contact 
  FOR UPDATE
  USING (auth.role() = 'authenticated');
  
CREATE POLICY "Authenticated users can delete do not contact records" 
  ON do_not_contact 
  FOR DELETE
  USING (auth.role() = 'authenticated');
```

## Integration with Anonymous User System
The "do not contact" functionality will integrate with the existing anonymous user tracking system:

1. When a user is marked as "do not contact":
   - Generate the anonymous hash for the user using the same algorithm used in the anonymous_users table
   - Store this hash in the `do_not_contact` table along with minimal contextual information
   - This ensures privacy while maintaining the ability to identify these users consistently

2. When displaying contacts:
   - Generate the hash for each contact
   - Check if the hash exists in the `do_not_contact` table
   - If found, mark the contact as "do not contact" in the UI

## UI Requirements

### Contact List Display
Enhance the existing contacts display with:

1. **User Type Indicator**:
   - Small badge/icon next to each name showing "Imported" or "Registered"
   - Determine this by checking if the user's hash exists in the anonymous_users table and its `user_type` value

2. **"Do Not Contact" Toggle**:
   - Replace the current "X" button with a toggle button or switch
   - When toggled on (do not contact), change the appearance of the entire contact row
   - Apply a distinct visual indicator (e.g., red highlight, strikethrough text, "Do Not Contact" badge)

3. **Visual Indicators**:
   - Contacts marked as "do not contact" should be visually distinct:
     - Desktop: Background color change to light red or gray
     - Mobile: "Do Not Contact" badge or icon clearly visible

### Responsive Design
Maintain the existing responsive design patterns:
- Desktop: Grid layout with columns for name, role, contact info, and actions
- Mobile: Condensed layout with essential information and toggle button

## Technical Implementation Details

### Contact Interface Extension
Extend the existing Contact interface:

```typescript
interface Contact {
  // Existing properties
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  head?: boolean | string;
  isHead?: boolean | string;
  headOfHousehold?: boolean | string;
  householdRole?: string;
  
  // New properties
  userType?: 'imported' | 'registered';
  doNotContact?: boolean;
  userHash?: string; // For internal use only, not displayed
}
```

### API Functions
Create the following server functions:

1. **Check Do Not Contact Status**:
```typescript
async function checkDoNotContactStatus(contacts: Contact[]): Promise<Contact[]> {
  // For each contact:
  // - Generate the user hash
  // - Query do_not_contact table to check if hash exists
  // - Set doNotContact property based on result
  // - Also check anonymous_users table to determine user type
  // Return the enhanced contacts array
}
```

2. **Toggle Do Not Contact Status**:
```typescript
async function toggleDoNotContactStatus(
  contact: Contact,
  doNotContact: boolean
): Promise<{ success: boolean; message: string }> {
  // Generate the user hash
  // If doNotContact=true, insert into do_not_contact table
  // If doNotContact=false, delete from do_not_contact table
  // Return success/failure message
}
```

### Integration with Existing Code
Modify the existing ContactsPage component:

1. Add state for tracking do-not-contact status:
```typescript
const [doNotContactHashes, setDoNotContactHashes] = useState<Set<string>>(new Set());
```

2. Load do-not-contact status with contacts:
```typescript
useEffect(() => {
  // After contacts are loaded:
  // - Call checkDoNotContactStatus to enhance contacts with doNotContact status
  // - Update the contacts state with the enhanced data
  // - Extract user hashes of "do not contact" users into the doNotContactHashes state
}, [contacts]);
```

3. Add toggle function:
```typescript
const handleToggleDoNotContact = async (contact: Contact) => {
  // Toggle the do-not-contact status for this contact
  // Call toggleDoNotContactStatus API function
  // Update local state based on result
};
```

## Visual Design
The UI should clearly indicate:

1. **Default state**: Normal contact display
2. **Do Not Contact state**:
   - Desktop: Row with red/gray background, "Do Not Contact" badge
   - Mobile: Contact with visible "Do Not Contact" indicator
3. **Toggle button**:
   - Unchecked: Normal state
   - Checked: Do Not Contact state

## Implementation Plan
1. Create do_not_contact database table
2. Implement server-side API functions for checking and toggling status
3. Extend the Contact interface and state management
4. Update the UI to show user type and do-not-contact status
5. Implement the toggle functionality
6. Add visual indicators for do-not-contact status
7. Test with various device sizes for responsive design

## Privacy and Security Considerations
- Store minimal identifying information in the do_not_contact table
- Use the same hashing algorithm as anonymous_users for consistency
- Ensure all database operations have appropriate row-level security
- Only authenticated users can view and modify the do-not-contact list 