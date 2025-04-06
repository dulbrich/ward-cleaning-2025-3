# Messenger Page Specification

## Overview
The Messenger page serves as a communication hub for ward leaders to send personalized SMS messages to ward members. This document outlines the design, functionality, and user experience for this critical feature of the Ward Cleaning application.

## Purpose
To provide an efficient interface for sending personalized text message reminders to ward members about their cleaning assignments. The page differentiates between registered users (who receive automated messages) and non-registered members (who receive manual messages).

## User Interface Components

### Header Section
- **Title**: "Messenger" prominently displayed
- **Subtitle**: Brief explanation of the page's purpose
- **Filter Controls**:
  - Dropdown for selecting ward sections (All, A-F, G-M, N-S, T-Z)
  - Toggle between "All Contacts" and "Non-Users Only"
- **Campaign Selection**:
  - Dropdown to select from pre-defined message templates (from Campaigns page)
  - Preview of the selected template with token placeholders highlighted

### Main Content Area

#### Contact List Section
- **Layout**: Two-column layout on desktop, single column on mobile
- **List Header**:
  - Indication of current filter (e.g., "Showing: Non-Users in Group A-F")
  - Count of contacts displayed
  - Search bar for filtering contacts by name
  - Sort options (alphabetical, by group)

#### Non-Registered Members List
- **Card Format**:
  - Contact name in prominent font (display name from ward.json)
  - Phone number in smaller text
  - Group/Assignment indicator (e.g., "Group A-F, 1st Saturday")
  - Message status indicator (not sent, sent)
  - Action button to send SMS
- **Visual States**:
  - Default: Normal state with send button
  - Sent: Struck-through name with green checkmark
  - Selected: Highlighted background when clicked

#### Registered Users (Future Implementation)
- Reserved section for showing users who have registered for the app
- Clicking on these contacts will show profile information instead of sending SMS

### Message Preview & Controls
- **Template Preview**:
  - Shows the currently selected message template
  - Displays how tokens will be replaced (e.g., {first} → "David")
- **Quick Actions**:
  - "Mark All Sent" button to mark all contacts as messaged
  - "Reset Status" button to clear all sent indicators

## Interaction Flow

### Sending a Message
1. Admin selects a campaign/message template
2. Admin filters the contact list as needed
3. Admin clicks on a contact card
4. System:
   - Prepares personalized message by replacing tokens
   - Opens the user's SMS app with pre-populated number and message
   - Marks the contact as "messaged" upon return to the app
5. Contact card updates to "sent" state with visual indicators

### Message Personalization
The system will replace the following tokens in message templates:
- `{first}`: First name extracted from displayName (e.g., "David" from "David Ulbrich")
- `{last}`: Last name extracted from displayName (e.g., "Ulbrich" from "David Ulbrich")
- `{group}`: Alphabetical group assignment (e.g., "A-F")
- `{schedule}`: Cleaning schedule details (e.g., "Saturday July 1st at 9AM")

## Data Requirements

### Input Data
- **Ward Data**: JSON file containing member information (similar to ward.json)
  - System will only display members where:
    - `head` property is `true`
    - Valid phone number exists
  - Example of valid member data:
    ```json
    {
      "uuid": "15af40b6-c9de-45ed-b055-b12f040f6190",
      "head": true,
      "displayName": "David Ulbrich",
      "phone": {
        "number": "(801) 971-9802",
        "e164": "+18019719802"
      }
    }
    ```
- **User Registration Data**: List of members who have registered for the app
  - Used to filter out registered users from the main contact list
- **Do Not Contact List**: List of members who have opted out of receiving messages
  - System must filter out any member whose phone number appears on this list
  - These members must not appear in the contact list regardless of other criteria
  - Do Not Contact status takes precedence over all other filtering options

### Processing Logic
- **Name Parsing**:
  - First name: Extract first word from displayName
  - Last name: Extract last word from displayName
  - Example: For "Brady Wendell Acor", first = "Brady", last = "Acor"
- **Group Assignment**:
  - Algorithm to assign members to alphabetical groups (A-F, G-M, etc.)
  - Each group assigned to specific Saturdays of the month
- **Contact Filtering Logic**:
  1. Start with complete ward.json data
  2. Remove members where `head` is not `true`
  3. Remove members without valid phone numbers
  4. Remove members whose phone numbers appear on the Do Not Contact list
  5. Remove members who have registered in the app (for non-user list view)
  6. Apply any additional filters (alphabetical groups, search terms, etc.)

### State Management
- Track which contacts have been messaged in the current session
- Optionally persist this state between sessions
- Allow clearing of message status

## Technical Specifications

### Component Structure
1. **MessengerPage**: Main container component
2. **FilterControls**: Controls for filtering the contact list
3. **CampaignSelector**: Interface for selecting message templates
4. **ContactList**: Displays the filtered list of contacts
5. **ContactCard**: Individual contact card with messaging action
6. **MessagePreview**: Shows preview of personalized message

### API Integration
- Endpoint to fetch ward member data
- Endpoint to fetch registered users
- Endpoint to fetch campaign templates
- Endpoint to update message sent status
- Endpoint to fetch the Do Not Contact list

### Mobile Integration
- Use `sms:` URI scheme with pre-populated message body
- Handle returning to the application after SMS app opens

### Responsive Design
- Desktop: Two-column layout with controls on left, contacts on right
- Tablet: Flexibly adjustable layout
- Mobile: Single column with fixed header and scrollable contact list

## Design Guidelines

### Colors
- Use primary brand colors for action buttons
- Use subtle backgrounds for contact cards
- Use clear visual indicators for message status (green for sent)

### Typography
- Clear hierarchy with larger text for names
- Smaller, muted text for secondary information
- Struck-through text for messaged contacts

### Spacing
- Comfortable padding within cards (16px)
- Adequate spacing between cards (12px)
- Clear separation between sections (24px)

## Accessibility Considerations
- High contrast between text and backgrounds
- Clear focus indicators for keyboard navigation
- Screen reader friendly labeling
- Touch targets at least 44×44px for mobile

## Future Enhancements
- Batch message sending capability
- Message scheduling
- Direct integration with Twilio for manual messages
- Message template editing on the fly
- Read receipts and response tracking

## Implementation Phases

### Phase 1
- Basic contact list display
- Filtering by ward section
- SMS launching functionality
- Basic message status tracking
- Do Not Contact list integration

### Phase 2
- Integration with campaign templates
- Token replacement for personalization
- Improved status tracking and persistence

### Phase 3
- User/non-user differentiation
- User profile viewing
- Advanced filtering and search

## Technical Notes
- Use efficient virtualized lists for performance with large contact sets
- Implement proper error handling for absent or malformed data
- Use local storage for saving message status between sessions
- Ensure proper sanitization of data before using in SMS templates
- Implement secure handling of the Do Not Contact list to ensure privacy
- Regularly sync the Do Not Contact list to ensure it's up-to-date 

## Database Structure

### Tables and Relationships

#### Do Not Contact List
The system uses the `do_not_contact` table to track members who have opted out of receiving messages:

```sql
CREATE TABLE IF NOT EXISTS do_not_contact (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_hash TEXT NOT NULL,
  marked_by UUID,
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (marked_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE do_not_contact ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view do not contact list
CREATE POLICY "Authenticated users can view do not contact list" 
  ON do_not_contact 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to add to do not contact list
CREATE POLICY "Authenticated users can insert do not contact records" 
  ON do_not_contact 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');
```

- The `user_hash` field stores a unique identifier for the ward member
- The system filters out all members whose `user_hash` appears in this table, regardless of other filter criteria
- The `marked_by` field references the authenticated user who added the member to the list
- Timestamps are maintained for auditing purposes
- Row Level Security ensures only authenticated users can access this sensitive data

#### Anonymous Users Table
The system tracks both imported contacts and registered users in the `anonymous_users` table:

```sql
CREATE TABLE IF NOT EXISTS anonymous_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_hash TEXT UNIQUE NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'imported',
  first_import_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_import_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  import_count INTEGER DEFAULT 1,
  registered_at TIMESTAMP WITH TIME ZONE,
  registered_user_id UUID REFERENCES auth.users(id),
  unit_number CHARACTER VARYING,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

- Members imported from ward.json initially have `user_type = 'imported'`
- When a member registers, their record is updated to `user_type = 'registered'`
- The `registered_user_id` field links to their auth.users entry
- The `user_hash` provides a consistent identifier across imports
- The `unit_number` associates the user with a specific ward/branch

#### Campaigns Table
The system stores message templates in the `campaigns` table, which are used for sending personalized messages:

```sql
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);

-- Enable Row Level Security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Allow users to view only their own campaigns
CREATE POLICY "Users can view their own campaigns" 
  ON campaigns 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create function to ensure only one default campaign per user
CREATE OR REPLACE FUNCTION ensure_single_default_campaign()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a campaign as default
  IF NEW.is_default = TRUE THEN
    -- Update any existing default campaigns to not be default
    UPDATE campaigns 
    SET is_default = FALSE 
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_default = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure only one default campaign per user
CREATE TRIGGER single_default_campaign_trigger
BEFORE INSERT OR UPDATE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION ensure_single_default_campaign();
```

- Each campaign is associated with a user via the `user_id` field
- Campaigns contain a `name` for identification and `content` that holds the message template
- The `is_default` field marks a campaign as the default selection in the Messenger interface
- A trigger ensures that only one campaign can be default per user
- Row Level Security ensures users can only access their own campaigns
- Campaigns support personalization tokens like `{first}`, `{last}`, `{group}`, and `{schedule}`

### Integration Flow

1. **Contact Import Process**:
   - When importing contacts from ward.json, each member gets a `user_hash` derived from their name and phone number
   - Members are inserted into `anonymous_users` with `user_type = 'imported'`
   - Import tracking fields (`first_import_at`, `last_import_at`, `import_count`) are updated

2. **Registration Association**:
   - When a user registers, the system attempts to match them with an existing `anonymous_users` record
   - If matched, the record is updated with `user_type = 'registered'`, `registered_at` timestamp, and `registered_user_id`
   - This creates a link between the authenticated user and their imported contact record

3. **Campaign Template Management**:
   - Users create message templates in the Campaigns interface
   - Templates are stored in the `campaigns` table associated with the user's ID
   - One campaign can be marked as default per user via the `is_default` field
   - The trigger `ensure_single_default_campaign` maintains this constraint automatically

4. **Messenger Contact Filtering**:
   - The system queries `anonymous_users` to determine which contacts have registered
   - It checks the `do_not_contact` table to exclude opted-out members
   - When "Non-Users Only" filter is active, only contacts with `user_type = 'imported'` are shown
   - Contacts with matching entries in the `do_not_contact` table are never displayed

5. **Message Personalization Process**:
   - The selected campaign template is retrieved from the `campaigns` table
   - For each contact, tokens in the template are replaced with personalized data:
     - `{first}` and `{last}` are derived from the contact's displayName
     - `{group}` is determined by alphabetical assignment
     - `{schedule}` is derived from the cleaning schedule
   - The personalized message is prepared for sending via SMS

6. **User Registration Status**:
   - Members with `user_type = 'registered'` receive automated communications through the app
   - Members with `user_type = 'imported'` receive manual SMS messages initiated by ward leaders

### Database Security

- Row Level Security (RLS) policies restrict data access to authenticated users
- Users can only access contacts within their own ward/unit
- The do_not_contact list is enforced at the query level to prevent accidental messaging
- Records in the anonymous_users table are associated with specific units to maintain data separation 