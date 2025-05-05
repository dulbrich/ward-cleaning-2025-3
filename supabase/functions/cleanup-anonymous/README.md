# Anonymous Users Cleanup Edge Function

This Edge Function is responsible for cleaning up anonymous user data from the Ward Cleaning application.

## Purpose

The function invokes the PostgreSQL database function `cleanup_anonymous_participants` which:

1. Identifies anonymous participants (where `is_authenticated = false`) for completed cleaning sessions
2. Sets the `purge_after` timestamp to 24 hours after session completion if not already set
3. Removes all anonymous participants whose purge time has passed
4. Cleans up any orphaned task assignments

## Deployment

To deploy this function to your Supabase project:

```bash
# Navigate to the project root
cd [project_root]

# Deploy the function (requires Supabase CLI)
supabase functions deploy cleanup-anonymous --no-verify-jwt
```

## Scheduling

This function should be scheduled to run daily. You can set this up in the Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to Edge Functions
3. Select the `cleanup-anonymous` function
4. Click "Schedule" and set it to run daily (e.g., at 3:00 AM)

Alternatively, you can use a third-party scheduling service like:
- GitHub Actions
- AWS CloudWatch Events
- Google Cloud Scheduler
- Integrating with services like Pipedream or n8n

## Testing

You can manually invoke the function using:

```bash
# Using Supabase CLI
supabase functions serve cleanup-anonymous

# From another terminal
curl -i --location --request POST 'http://localhost:54321/functions/v1/cleanup-anonymous' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json'
```

## Monitoring

The function returns a JSON response with:
- Success/failure status
- Timestamp of execution
- Any data returned by the database function

You should implement monitoring to ensure this function runs successfully each day. 