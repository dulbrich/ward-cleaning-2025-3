# Realtime Configuration

To enable realtime updates for the task management system, follow these steps:

## 1. Enable Realtime in Supabase Dashboard

1. Log in to your Supabase dashboard
2. Navigate to "Database" > "Replication"
3. Ensure the following tables are added to the `supabase_realtime` publication:
   - `cleaning_session_tasks`
   - `cleaning_sessions`
   - `session_participants`
   - `task_viewers`

## 2. Run the Database Script

Run the following command to set up the database properly for realtime:

```bash
psql YOUR_DATABASE_URL -f database/enable_realtime.sql
```

## 3. Update Supabase Client for Better Realtime

For optimal realtime performance, the Supabase client is configured with:

```typescript
createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);
```

## Debugging Realtime Issues

1. Open multiple browser tabs to test realtime updates
2. Check browser console for any errors related to WebSocket connections
3. Ensure your database tables have proper REPLICA IDENTITY set (FULL is recommended for realtime)
4. In development mode, a realtime debugger is visible in the bottom right corner of the tasks page
