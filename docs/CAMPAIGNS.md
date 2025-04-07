# Campaigns Page Specification

## Overview
The Campaigns page enables ward leaders to create, edit, and manage message templates for SMS communications with ward members. These templates serve as the foundation for personalized messages sent through the Messenger feature, streamlining the communication process.

## Purpose
To provide an intuitive interface for creating and managing reusable message templates with personalization tokens, reducing the effort required to send consistent, personalized communications to ward members about their cleaning assignments.

## User Interface Components

### Header Section
- **Title**: "Campaigns" prominently displayed
- **Subtitle**: Brief explanation of the page's purpose
- **Action Buttons**:
  - "New Campaign" button to create a new template
  - "Save All" button to persist changes to all templates

### Main Content Area

#### Campaign List Section
- **Layout**: Two-column layout on desktop, single column on mobile
- **List Header**:
  - Count of available campaigns
  - Search bar for filtering campaigns by name
  - Sort options (alphabetical, recently updated, date created)

#### Campaign Cards
- **Card Format**:
  - Campaign name in prominent font
  - Preview of message content (truncated if long)
  - Last edited date
  - Default status indicator (star icon for default campaign)
  - Action buttons:
    - Edit (opens campaign in editor)
    - Delete (with confirmation)
    - Set as Default (star icon)
- **Visual States**:
  - Default: Normal state
  - Selected: Highlighted background when clicked
  - Default Campaign: Displays star icon and subtle highlight

### Campaign Editor
- **Name Field**: Input for campaign name
- **Message Composer**:
  - Rich text area for composing message content
  - Character counter with SMS message limit indicator (160 chars per SMS)
  - Token insertion toolbar with buttons for:
    - `{first}`: Member's first name
    - `{last}`: Member's last name
    - `{group}`: Alphabetical group assignment
    - `{schedule}`: Cleaning schedule details
  - Visual highlighting of inserted tokens in the message body
- **Preview Section**:
  - Shows how the message will appear with sample data
  - Updates dynamically as the message is edited
  - Toggle to view as different sample members
- **Set as Default**: Checkbox to set the current campaign as the default
- **Action Buttons**:
  - "Save" button to save changes
  - "Cancel" button to discard changes
  - "Delete" button (with confirmation)

## Interaction Flow

### Creating a New Campaign
1. Admin clicks "New Campaign" button
2. System displays empty campaign editor with focus on name field
3. Admin enters campaign name and message content
4. Admin inserts tokens as needed by clicking token buttons
5. Admin reviews message in preview section
6. Admin saves the campaign
7. System adds the new campaign to the list

### Editing an Existing Campaign
1. Admin clicks on a campaign card or its edit button
2. System displays campaign editor with populated fields
3. Admin makes desired changes to name or message content
4. Admin reviews changes in preview section
5. Admin saves the updated campaign
6. System updates the campaign in the list

### Setting a Default Campaign
1. Admin clicks "Set as Default" button on a campaign card or toggles the checkbox in the editor
2. System:
   - Removes default status from any previously default campaign
   - Sets the selected campaign as default
   - Updates visual indicators to show the new default status
3. System will now pre-select this campaign in the Messenger page

### Deleting a Campaign
1. Admin clicks delete button on a campaign card or in the editor
2. System displays confirmation dialog
3. Admin confirms deletion
4. System removes the campaign from the list
5. If the deleted campaign was the default, system prompts to select a new default

## Data Requirements

### Campaign Object Structure
```json
{
  "id": "campaign-uuid",
  "name": "First Saturday Reminder",
  "content": "Hello {first}, this is a reminder that your assigned cleaning day is {schedule}. You are in group {group}. Please let us know if you have any questions.",
  "isDefault": true,
  "createdAt": "2023-06-15T14:30:00Z",
  "updatedAt": "2023-06-16T09:45:00Z"
}
```

### Processing Logic
- **Token Handling**:
  - System must clearly differentiate tokens in the UI
  - When inserting tokens, proper spacing should be maintained
  - Preview must accurately demonstrate token replacement
- **Default Campaign Logic**:
  - Only one campaign can be default at a time
  - If no campaigns exist, the first created becomes default
  - If the default campaign is deleted, prompt user to select a new default

### State Management
- Track edits to campaigns before saving
- Provide undo/redo functionality in the editor
- Warn about unsaved changes when navigating away

## Technical Specifications

### Component Structure
1. **CampaignsPage**: Main container component
2. **CampaignList**: Displays all available campaigns
3. **CampaignCard**: Individual campaign card with actions
4. **CampaignEditor**: Interface for creating/editing campaigns
5. **TokenToolbar**: Buttons for inserting personalization tokens
6. **MessagePreview**: Shows preview of personalized message

### API Integration
- Endpoint to fetch all campaigns
- Endpoint to create a new campaign
- Endpoint to update an existing campaign
- Endpoint to delete a campaign
- Endpoint to set a campaign as default

### Responsive Design
- Desktop: Two-column layout with list on left, editor on right
- Tablet: Flexible layout with possible collapsing sections
- Mobile: Single column with tabs or accordions for list and editor

## Design Guidelines

### Colors
- Use primary brand colors for action buttons
- Use subtle backgrounds for campaign cards
- Use visual highlighting for tokens in the message composer

### Typography
- Clear hierarchy with larger text for campaign names
- Readable font for message content
- Visual distinction for tokens within messages

### Spacing
- Comfortable padding within cards and editor (16px)
- Adequate spacing between cards (12px)
- Clear separation between sections (24px)

## Accessibility Considerations
- High contrast between text and backgrounds
- Clear focus indicators for keyboard navigation
- Screen reader friendly labeling for token buttons
- Descriptive aria attributes for interactive elements

## Future Enhancements
- Campaign categories or tags for organization
- Template variables beyond the basic tokens
- Campaign effectiveness metrics
- A/B testing of different message variations
- Advanced formatting options
- Scheduling options for campaigns
- Import/export functionality

## Implementation Phases

### Phase 1
- Basic campaign list display
- Simple campaign editor with token insertion
- Default campaign selection
- Essential CRUD operations

### Phase 2
- Enhanced preview functionality
- Improved token visualization
- Undo/redo in editor
- Character counting and SMS segmentation

### Phase 3
- Campaign analytics
- Advanced formatting options
- Campaign categories/organization
- Advanced preview with multiple sample members

## Technical Notes
- Implement proper validation for campaign names and content
- Ensure proper escaping of tokens in message content
- Optimize for performance with many campaigns
- Implement autosave functionality to prevent data loss
- Ensure clear distinction between edit and view modes
- Consider implemention progressive enhancement for browsers without advanced text editing support

## Database Schema

```sql
-- Create campaigns table to store message templates
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

-- Allow users to insert their own campaigns
CREATE POLICY "Users can insert their own campaigns" 
  ON campaigns 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own campaigns
CREATE POLICY "Users can update their own campaigns" 
  ON campaigns 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to delete their own campaigns
CREATE POLICY "Users can delete their own campaigns" 
  ON campaigns 
  FOR DELETE 
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

-- Create trigger for automatically updating the updated_at timestamp
CREATE TRIGGER update_campaigns_modtime
BEFORE UPDATE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
```

This SQL creates a `campaigns` table that:
1. Associates each campaign with a user via the `user_id` field
2. Stores the campaign name and message content
3. Tracks whether a campaign is the default one for a user
4. Implements appropriate timestamps for creation and updates
5. Sets up Row Level Security to ensure users can only access their own campaigns
6. Creates a trigger to ensure a user can only have one default campaign at a time
7. Adds a trigger to automatically update the `updated_at` timestamp on changes 