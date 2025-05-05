# Ward Cleaning App - Anonymous Users Task View Specification

## Overview
This document outlines the requirements and functionality for the anonymous user experience on the Ward Cleaning task page. The feature allows ward members to participate in cleaning activities without requiring an account, while encouraging eventual signup for enhanced features.

## User Flow

### 1. Entry Points
Users can access the anonymous task view through:
- QR code (generated from the tasks page)
- Direct link (shared by ward leaders)
- Public access code entry

### 2. Onboarding Modal

#### Initial Modal Screen
When a user first lands on the page without being authenticated, an onboarding modal appears with two clear options:

**UI Components:**
- **Header:** "Welcome to Ward Cleaning"
- **Subheader:** "Choose how you'd like to participate in today's cleaning session"
- **Options:**
  - "Continue as Guest" button
  - "Sign Up" button (primary/highlighted)
- **Informational text:** Brief explanation of benefits for signing up vs. guest mode

#### Benefits Highlight Section
To encourage signup, display a comparison table:

| Guest Mode | Signed-Up Member |
|------------|------------------|
| ✓ View and claim tasks | ✓ View and claim tasks |
| ✓ Track progress | ✓ Track progress |
| ✓ Collaborate with others | ✓ Collaborate with others |
| ✗ No cleaning calendar | ✓ Cleaning calendar access |
| ✗ No notifications | ✓ Customizable notifications |
| ✗ No leaderboard participation | ✓ Earn points and compete |
| ✗ Must re-enter info each time | ✓ Persistent profile |

### 3. Sign Up Path
If user selects "Sign Up":

- Redirect to the signup flow as specified in ONBOARDING.md
- Include ward code (extracted from the URL or QR code) as a pre-filled field
- After signup completion, return user to the tasks page with full authentication

### 4. Guest Mode Setup
If user selects "Continue as Guest":

#### User Identification Form
**UI Components:**
- **Header:** "Create Your Guest Profile"
- **Subheader:** "This information will only be used for today's cleaning session"
- **Form Fields:**
  - Display Name input field (pre-filled with random fun name like "Speedy Cleaner 1234")
  - Avatar selection grid:
    - 8-12 default avatar options
    - Selected randomly by default
  - "Continue to Tasks" button

**Technical Implementation:**
- Generate a temporary user ID (`temp_user_id`) in format: `anon_[random-string]`
- Store in local storage: `localStorage.setItem("tempUserId_[sessionId]", tempUserId)`
- Create record in `session_participants` table with:
  - `session_id`: Current cleaning session ID
  - `temp_user_id`: Generated ID
  - `display_name`: User-selected or generated name
  - `is_authenticated`: false
  - `last_active_at`: Current timestamp

## 5. Anonymous Task View

### Layout
- Remove standard app layout (no header, footer, or sidebar)
- Full-screen dedicated task view
- Maintain core tasks functionality identical to authenticated view

### UI Components
- Persistent "Sign Up" button in corner of screen (subtle but visible)
- Badge or indicator showing user is in "Guest Mode"
- All core task functionality from main `tasks/page.tsx`:
  - Kanban/List view toggle
  - Task cards showing:
    - Title
    - Description
    - Priority
    - Kid-friendly indicators
    - Points value (even though anonymous users won't earn them)
  - Task detail view
  - Ability to claim tasks
  - Ability to mark tasks as "doing" and "done"

### QR Code for Session Sharing
- Prominently display a QR code in the top right corner of the page
- QR code should encode the current session URL with any necessary access parameters
- Include a "Share" button next to the QR code that allows:
  - Copying the session link
  - Displaying a larger version of the QR code for easier scanning
  - Brief instructions: "Have others scan this code to join the cleaning session"
- QR code should be high-contrast and of sufficient size for easy scanning
- Consider implementing a "QR code spotlight" feature that temporarily enlarges the QR code when clicked

### User Identification Display
- Show anonymous user avatar and name in:
  - Task cards (when assigned to that user)
  - Participant lists
  - Activity feeds
  - Task detail viewers list

### Persistence
- Store anonymous user state in local storage
- If user closes and reopens within the session timeframe, attempt to restore their anonymous identity
- Show reconnection message: "Welcome back, [display_name]"

## 6. Data Handling & Cleanup

### Session Duration
- Anonymous user data remains valid for the duration of the cleaning session
- Add 24-hour grace period after session end

### Cleanup Process
- Create a scheduled task to run daily that:
  - Identifies session_participants with is_authenticated=false
  - Checks if associated cleaning_session ended >24 hours ago
  - Removes those participant records and any associated task assignments

### Data Privacy
- Anonymous users should be informed that their data is temporary
- No personal information beyond chosen display name is collected
- Clearly communicate that anonymous participation doesn't earn points

## Implementation Phases

### Phase 1: Database Setup (Estimated: 2 days)
1. **Database Schema Updates**
   - Add avatar_url and purge_after columns to session_participants table
   - Create index on temp_user_id and is_authenticated
   - Create default_avatars table and populate with initial avatars
   - Test database changes with manual queries

2. **Cleanup Function Development**
   - Create and test the cleanup_anonymous_participants function
   - Set up a scheduled job for automated cleanup
   - Document the cleanup process for operational handover

### Phase 2: Core Anonymous Experience (Estimated: 4 days)
1. **Route Configuration**
   - Create public/tasks/[sessionId] route structure
   - Implement route handlers and parameter validation
   - Set up proper redirection and error handling

2. **Anonymous Tasks Layout**
   - Create AnonymousTasksLayout.tsx with simplified header/no sidebar
   - Port core task viewing functionality from existing tasks page
   - Test the layout with various screen sizes

3. **Onboarding Modal**
   - Develop AnonymousOnboardingModal component with options
   - Create benefits comparison table UI
   - Implement logic for directing users to guest setup or signup flows

4. **Guest Profile Setup Form**
   - Build GuestProfileSetup.tsx component
   - Implement avatar selection grid
   - Create random name generator
   - Add local storage persistence for guest information

### Phase 3: Integration & Sharing (Estimated: 3 days)
1. **ShareSessionDialog Updates**
   - Update URL generation in ShareSessionDialog.tsx
   - Ensure QR code correctly uses the anonymous URL format
   - Test sharing functionality across devices

2. **SessionQRCode Component**
   - Create dedicated QR code component with spotlight feature
   - Position QR code prominently in anonymous task view
   - Add copy functionality for the session URL

3. **Anonymous Task Management**
   - Enhance TaskDetail component to support anonymous users
   - Update task assignment logic to use temp_user_id
   - Ensure task viewers correctly display anonymous participants

### Phase 4: UI Enhancements & Testing (Estimated: 3 days)
1. **Guest Mode UI Indicators**
   - Add guest mode badge/indicator
   - Enhance the sign-up button for anonymous users
   - Implement tooltips explaining guest limitations

2. **Session Persistence Improvements**
   - Add reconnection logic for returning anonymous users
   - Implement welcome back message
   - Test session persistence across browser sessions

3. **Cross-Browser & Device Testing**
   - Test on multiple browsers (Chrome, Safari, Firefox, Edge)
   - Ensure mobile responsiveness
   - Verify QR code functionality on various devices

### Phase 5: Refinement & Documentation (Estimated: 2 days)
1. **Performance Optimization**
   - Review and optimize real-time updates
   - Ensure efficient rendering of participant lists
   - Test with large numbers of concurrent users

2. **Analytics & Monitoring**
   - Add analytics tracking for anonymous vs. authenticated usage
   - Implement monitoring for database cleanup job
   - Set up alerts for potential issues

3. **Documentation & Handover**
   - Update user documentation
   - Create admin guide for managing anonymous users
   - Document code for future developers

## Technical Implementation Notes

### Components to Create/Modify:
1. `AnonymousTasksLayout.tsx` - Simplified layout without header/footer
2. `AnonymousOnboardingModal.tsx` - Initial modal for path selection
3. `GuestProfileSetup.tsx` - Form for setting display name and avatar
4. `AnonymousTasksPage.tsx` - Adapted from main tasks page without authenticated features
5. `SessionQRCode.tsx` - Component for generating and displaying session QR codes

### Modifications to Existing Tasks Page
Based on the current implementation in app/tasks/page.tsx, the following changes will be needed:

1. **Route Configuration:**
   - Create a dedicated route for the anonymous view (`/public/tasks/[sessionId]`)
   - This allows for differentiation between authenticated and anonymous views

2. **Existing Sharing Functionality:**
   - The existing `ShareSessionDialog.tsx` component already generates sharing links and QR codes
   - It uses the session's `public_access_code` to create a public URL: `${baseUrl}/public-session/${publicAccessCode}`
   - This same URL should be used as the entry point for the anonymous user experience
   - No changes are needed to the link generation logic, only to the destination route handling

3. **Existing Components Adaptations:**
   - Update the public URL path in ShareSessionDialog to point to the new anonymous route: `/public/tasks/${sessionId}` instead of `/public-session/${publicAccessCode}`
   - Ensure the QR code in ShareSessionDialog continues to use the same URL for consistency
   - Add avatar selection functionality to `SignUpPrompt.tsx` or create a new component for this purpose

4. **Anonymous User Logic Updates:**
   - Currently, the existing code handles anonymous users with the `temp_user_id` field, but does not include:
     ```typescript
     // Add to the joinSession function in tasks/page.tsx
     // For anonymous users with avatar selection
     const participantData = {
       session_id: currentSessionId,
       temp_user_id: tempUserId,
       display_name: userSelectedName || displayName,
       avatar_url: selectedAvatarUrl,
       is_authenticated: false,
       last_active_at: new Date().toISOString()
     };
     ```

5. **Guest Mode UI Enhancements:**
   - Add a "Guest Mode" indicator to the UI when a user is participating anonymously
   - Modify the existing "Sign Up" button to be more prominent for anonymous users
   - Add explanatory tooltips about the limitations of guest mode

6. **Session Persistence Improvements:**
   - Update the `useEffect` hook that checks for anonymous users to restore their avatar selection
   - Add logic to detect when a user returns to a session they previously participated in

### Database Changes:

#### Required Modifications
The database already has most of the necessary structure in place, but these additions/modifications are required:

1. **Add to session_participants table:**
   ```sql
   -- Add columns
   ALTER TABLE session_participants 
   ADD COLUMN avatar_url TEXT,
   ADD COLUMN purge_after TIMESTAMP WITH TIME ZONE;
   
   -- Create index as a separate command (PostgreSQL syntax)
   CREATE INDEX idx_session_participants_temp_user 
   ON session_participants(temp_user_id, is_authenticated);
   ```

2. **Create default_avatars table:**
   ```sql
   CREATE TABLE default_avatars (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     avatar_url TEXT NOT NULL,
     avatar_name TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     active BOOLEAN DEFAULT TRUE
   );
   
   -- Insert default avatars
   INSERT INTO default_avatars (avatar_url, avatar_name)
   VALUES
     ('/images/avatars/avatar1.png', 'Cleaning Champion'),
     ('/images/avatars/avatar2.png', 'Dust Destroyer'),
     ('/images/avatars/avatar3.png', 'Mop Master'),
     ('/images/avatars/avatar4.png', 'Vacuum Virtuoso'),
     ('/images/avatars/avatar5.png', 'Window Wizard'),
     ('/images/avatars/avatar6.png', 'Bathroom Brave'),
     ('/images/avatars/avatar7.png', 'Kitchen Knight'),
     ('/images/avatars/avatar8.png', 'Scrubbing Star');
   ```

3. **Create function for session participant cleanup:**
   ```sql
   CREATE OR REPLACE FUNCTION cleanup_anonymous_participants()
   RETURNS void AS $$
   BEGIN
     -- Update purge_after for completed sessions
     UPDATE session_participants
     SET purge_after = cleaning_sessions.completed_at + INTERVAL '24 hours'
     FROM cleaning_sessions
     WHERE session_participants.session_id = cleaning_sessions.id
     AND cleaning_sessions.status = 'completed'
     AND session_participants.is_authenticated = false
     AND session_participants.purge_after IS NULL;
     
     -- Delete anonymous participants for expired sessions
     DELETE FROM session_participants
     WHERE is_authenticated = false
     AND purge_after < NOW();
     
     -- Also delete any task assignments for these participants
     DELETE FROM cleaning_session_tasks
     WHERE assigned_to_temp_user IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM session_participants
       WHERE session_participants.temp_user_id = cleaning_session_tasks.assigned_to_temp_user
     );
   END;
   $$ LANGUAGE plpgsql;
   ```

4. **Create scheduled job for cleanup:**
   ```sql
   -- This SQL would be executed by a scheduler (Supabase Edge Functions cron or similar)
   SELECT cleanup_anonymous_participants();
   ```

#### Existing Features to Leverage
The database already has these necessary structures in place:
- `session_participants` table with `temp_user_id` field
- `cleaning_session_tasks` with `assigned_to_temp_user` field
- `task_viewers` table for tracking who is viewing a task

### State Management:
- Use local storage for maintaining anonymous session state
- Include session and participant IDs for reconnection

### Scheduled Job:
```sql
-- Example cleanup query
DELETE FROM session_participants 
WHERE is_authenticated = false 
AND session_id IN (
  SELECT id FROM cleaning_sessions 
  WHERE completed_at < NOW() - INTERVAL '24 hours'
);
```

## Development Timeline
- Component Development: 4 days
- Database Modifications: 1 day
- Integration Testing: 2 days
- User Testing: 2 days
- Refinement: 1 day

Total Estimated Development Time: 10 working days 