# Contacts Page Specification

## Overview
This document specifies enhancements to the Contacts page to enable users to mark ward members as "do not contact." This functionality helps ward leaders and members respect privacy preferences and ensures members who do not wish to be contacted are easily identifiable in the system.

## Purpose
- Display a list of ward members with their contact information
- Allow users to mark/unmark individuals as "do not contact"
- Clearly indicate which members should not be contacted
- Distinguish between imported users and registered users
- Store "do not contact" preferences in the database using anonymous hashing
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
  marked_by UUID REFERENCES auth.users(id),
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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
   - Store only this hash in the `do_not_contact` table without any personally identifiable information
   - This approach ensures complete privacy while maintaining the ability to identify these users consistently

2. When displaying contacts:
   - Generate the hash for each contact
   - Check if the hash exists in the `do_not_contact` table
   - If found, mark the contact as "do not contact" in the UI

## UI Requirements

### Contact List Display
Enhance the existing contacts display with:

1. **User Type Indicator**:
   - **Desktop**: Small badge/icon next to each name showing "Imported" or "Registered" (right-justified)
   - **Mobile**: Subtle green background tint for registered users, no explicit type label
   - Determine type by checking if the user's hash exists in the anonymous_users table and its `user_type` value

2. **"Do Not Contact" Functionality**:
   - **Desktop**: Toggle switch button next to each imported user (registered users display "Self-managed" text)
   - **Mobile**: Swipe-left gesture to mark/unmark imported users as "do not contact" (no visible toggle button)
   - When a contact is marked as "do not contact", the entire row changes appearance

3. **Visual Indicators**:
   - Contacts marked as "do not contact" should be visually distinct:
     - **Desktop**: Background color change to light red, toggle button in active state
     - **Mobile**: Red background tint without explicit "Do Not Contact" text label
   - Registered users have a visual indicator:
     - **Desktop**: "Self-managed" text in place of the toggle
     - **Mobile**: Small green dot and subtle green background tint

4. **Search Functionality**:
   - Search input with custom clear button (X) that appears in the same position as the search icon
   - Clear button visible only when search text is present
   - Search icon visible only when search field is empty

### Responsive Design
The design adapts to different screen sizes:
- **Desktop**: Grid layout with columns for name, role, contact info, and toggle/status
- **Mobile**: 
  - Condensed layout with simplified information
  - Swipe-left interaction rather than toggle button
  - Right-justified phone numbers
  - Visual indicators through background colors instead of text labels
  - Small icons instead of text labels where possible

## Special Handling for User Types

### Imported Users
- Can be marked as "do not contact" by admin users
- Toggle switch (desktop) or swipe gesture (mobile) available
- Status saved to database via anonymous hash

### Registered Users 
- Cannot be marked as "do not contact" by admin users
- Display as "Self-managed" (desktop) or with green dot indicator (mobile)
- No toggle button or swipe functionality available
- Manage their own preferences separately

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
  userType?: 'imported' | 'registered' | 'unknown';
  doNotContact?: boolean;
  userHash?: string; // For internal use only, not displayed
  _updated?: number; // Timestamp for React state management
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
  // Skip registered users
  // Generate the user hash
  // If doNotContact=true, insert into do_not_contact table with only the hash
  // If doNotContact=false, delete from do_not_contact table
  // Return success/failure message
}
```

### Mobile Interaction
Implement touch gestures for mobile users:
```typescript
// Touch event handlers for swipe functionality
const handleTouchStart = (e: React.TouchEvent, contactHash: string) => {
  // Track starting position of swipe
}

const handleTouchMove = (e: React.TouchEvent) => {
  // Track current position during swipe
}

const handleTouchEnd = (contact: Contact) => {
  // If swipe distance exceeds threshold and contact is not registered
  // Toggle contact's do-not-contact status
}
```

## Visual Design
The UI should clearly indicate:

1. **Default state**: Normal contact display
   - Imported: White/transparent background
   - Registered: Subtle green background tint, green dot indicator (mobile)

2. **Do Not Contact state**:
   - Desktop: Row with red background, toggle in active position
   - Mobile: Red background tint, no explicit label

3. **Interactive elements**:
   - Desktop: Toggle button for imported users, "Self-managed" text for registered
   - Mobile: Swipe gesture for imported users, no interaction for registered

## Implementation Plan
1. Create do_not_contact database table
2. Implement server-side API functions for checking and toggling status
3. Extend the Contact interface and state management
4. Implement desktop view with toggle buttons
5. Implement mobile view with swipe functionality
6. Add visual indicators for all user states
7. Ensure proper key management for React rendering
8. Test with various device sizes for responsive design

## Privacy and Security Considerations
- **No personally identifiable information**: The do_not_contact table stores only anonymous hashes and metadata
- **Complete anonymity**: Even if the database is compromised, it contains no personally identifiable information
- **Hash-based identification**: Uses the same secure hashing algorithm as anonymous_users for consistency
- **Minimal data collection**: Only stores the absolute minimum data required to identify contacts for exclusion
- **Zero exposure risk**: No name, phone, or other contact details are stored in the do_not_contact table
- **Robust access control**: Row-level security ensures only authenticated users can view and modify the list 