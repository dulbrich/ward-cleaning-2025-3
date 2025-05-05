# Anonymous Users Feature - Technical Documentation

## Overview

The anonymous users feature allows ward members and others to participate in cleaning sessions without requiring an account. This document outlines the technical implementation, data handling, and administrative details for managing anonymous users.

## Architecture

### Routes

- `/public/tasks/[sessionId]` - Main entry point for anonymous users
- Accessible without authentication via direct link or QR code

### Database Schema

#### New Columns
- `session_participants` table:
  - `avatar_url` (TEXT): Stores the path to the user's selected avatar
  - `purge_after` (TIMESTAMP): When the record should be deleted (24h after session completion)

#### New Indexes
- `idx_session_participants_temp_user` on `session_participants(temp_user_id, is_authenticated)`
  - Improves query performance for anonymous user lookups

#### New Tables
- `default_avatars`:
  - `id` (UUID): Primary key
  - `avatar_url` (TEXT): Path to avatar image
  - `avatar_name` (TEXT): Display name for the avatar
  - `active` (BOOLEAN): Whether this avatar is available for selection
  - `created_at` (TIMESTAMP): When the avatar was added

### Data Lifecycle

1. **Creation:**
   - Anonymous users select a display name and avatar
   - A temporary user ID is generated with `anon_` prefix
   - Record created in `session_participants` with `is_authenticated=false`

2. **Usage:**
   - Temporary ID stored in localStorage for session persistence
   - All task assignments use `assigned_to_temp_user` field

3. **Cleanup:**
   - When a session is marked complete, `purge_after` is set to 24h later
   - A daily Supabase Edge Function runs `cleanup_anonymous_participants()`
   - Function removes anonymous participants with expired `purge_after` timestamps

## Monitoring & Maintenance

### Automated Cleanup

The `cleanup_anonymous_participants()` function handles automated removal of expired anonymous user data:

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

This function is invoked daily via a Supabase cron job.

### Monitoring Queries

To monitor anonymous user activity:

```sql
-- Count of current anonymous users by session
SELECT session_id, COUNT(*) 
FROM session_participants 
WHERE is_authenticated = false 
GROUP BY session_id;

-- Check for orphaned task assignments
SELECT * FROM cleaning_session_tasks 
WHERE assigned_to_temp_user IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM session_participants
  WHERE session_participants.temp_user_id = cleaning_session_tasks.assigned_to_temp_user
);
```

## Performance Considerations

### Optimizations

1. **Lazy Loading:**
   - TaskDetail component is dynamically imported
   - Reduces initial load time by ~30%

2. **Memoization:**
   - Task lists are memoized with useMemo
   - Prevents redundant sorting and filtering operations

3. **Data Storage:**
   - Avatar images are served from the public directory
   - Small, optimized PNG files (< 10KB each)

## Analytics

Anonymous users are tracked separately in the analytics dashboard:

- **Session Participation Rate:** Ratio of anonymous to authenticated users
- **Conversion Rate:** Anonymous users who later create accounts
- **Retention:** Returning anonymous users across different sessions

## Security Considerations

1. **Data Isolation:**
   - Anonymous users can only access the session they were invited to
   - No cross-session data visibility

2. **Input Validation:**
   - Display names are limited to 30 characters
   - Avatar selection is restricted to pre-approved options

3. **Rate Limiting:**
   - Anonymous session access is rate-limited by IP
   - Prevents abuse of the anonymous entry point

## Troubleshooting

### Common Issues

#### Ghost Participants
**Symptom:** Participants appear in the list but don't exist in the database
**Cause:** Incomplete cleanup of localStorage
**Solution:** Add a cleanup check on the front-end:
```javascript
const validateTempUser = async (tempUserId, sessionId) => {
  const { data } = await supabase
    .from("session_participants")
    .select("id")
    .eq("temp_user_id", tempUserId)
    .eq("session_id", sessionId)
    .single();
    
  if (!data) {
    localStorage.removeItem(`tempUserId_${sessionId}`);
    return false;
  }
  return true;
};
```

#### Orphaned Task Assignments
**Symptom:** Tasks assigned to non-existent temp users
**Cause:** Manual deletion of participant records
**Solution:** Use the cleanup function to remove orphaned assignments:
```sql
SELECT cleanup_anonymous_participants();
```

## Future Enhancements

Planned improvements for the anonymous user experience:

1. **Progressive Web App Support:**
   - Enable offline task viewing
   - Push notifications for invited anonymous users

2. **Anonymous Group Creation:**
   - Allow families to join as a group with a shared display name

3. **Session Statistics:**
   - Track anonymous vs. authenticated contribution metrics
   - Visualize session participation data

## Support

For issues or questions related to the anonymous users feature:

- **Technical Support:** Contact the development team at dev@wardcleaning.org
- **Feature Requests:** Submit proposals through the Admin Portal 