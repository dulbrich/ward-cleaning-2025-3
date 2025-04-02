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