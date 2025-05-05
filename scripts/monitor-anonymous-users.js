// Script to monitor anonymous users and cleanup performance
// Run with: npm run monitor-anonymous

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with admin privileges
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function monitorAnonymousUsers() {
  console.log('============================================');
  console.log('ANONYMOUS USERS MONITORING REPORT');
  console.log('============================================');
  console.log(`Generated at: ${new Date().toISOString()}`);
  console.log('--------------------------------------------\n');

  // 1. Count active anonymous users by session
  const { data: activeUsersBySessions, error: activeError } = await supabase
    .from('session_participants')
    .select('session_id')
    .eq('is_authenticated', false)
    .gt('last_active_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .then(({ data, error }) => {
      if (error) return { data: null, error };
      
      // Group by session and count
      const sessionCounts = data.reduce((acc, item) => {
        acc[item.session_id] = (acc[item.session_id] || 0) + 1;
        return acc;
      }, {});
      
      return { 
        data: Object.entries(sessionCounts).map(([sessionId, count]) => ({ sessionId, count })),
        error: null
      };
    });

  if (activeError) {
    console.error('Error fetching active anonymous users:', activeError);
  } else {
    console.log('ACTIVE ANONYMOUS USERS BY SESSION:');
    if (activeUsersBySessions.length === 0) {
      console.log('No active anonymous users in the last 24 hours.');
    } else {
      console.table(activeUsersBySessions);
    }
  }
  console.log('--------------------------------------------\n');

  // 2. Check for pending cleanup
  const { data: pendingCleanup, error: pendingError } = await supabase
    .from('session_participants')
    .select('id, session_id, temp_user_id, purge_after')
    .eq('is_authenticated', false)
    .lt('purge_after', new Date().toISOString());

  if (pendingError) {
    console.error('Error checking for pending cleanup:', pendingError);
  } else {
    console.log('PENDING CLEANUP RECORDS:');
    if (pendingCleanup.length === 0) {
      console.log('No records pending cleanup.');
    } else {
      console.log(`Found ${pendingCleanup.length} records that should be cleaned up.`);
      console.table(pendingCleanup.slice(0, 10)); // Show first 10 only
      
      if (pendingCleanup.length > 10) {
        console.log(`... and ${pendingCleanup.length - 10} more records.`);
      }
    }
  }
  console.log('--------------------------------------------\n');

  // 3. Check for orphaned task assignments
  const { data: orphanedTasks, error: orphanedError } = await supabase
    .rpc('find_orphaned_tasks');

  if (orphanedError) {
    console.error('Error checking for orphaned tasks:', orphanedError);
  } else {
    console.log('ORPHANED TASK ASSIGNMENTS:');
    if (orphanedTasks.length === 0) {
      console.log('No orphaned task assignments found.');
    } else {
      console.log(`Found ${orphanedTasks.length} orphaned task assignments.`);
      console.table(orphanedTasks.slice(0, 10)); // Show first 10 only
      
      if (orphanedTasks.length > 10) {
        console.log(`... and ${orphanedTasks.length - 10} more records.`);
      }
    }
  }
  console.log('--------------------------------------------\n');

  // 4. Get conversion stats (anonymous users who later created accounts)
  console.log('CONVERSION METRICS:');
  console.log('This feature requires additional tracking implementation.');
  console.log('--------------------------------------------\n');

  // 5. Check cleanup function last run
  const { data: lastRun, error: lastRunError } = await supabase
    .from('maintenance_logs')
    .select('operation, executed_at, status')
    .eq('operation', 'cleanup_anonymous_participants')
    .order('executed_at', { ascending: false })
    .limit(1)
    .single();

  if (lastRunError && lastRunError.code !== 'PGRST116') {
    console.error('Error checking cleanup function last run:', lastRunError);
  } else if (lastRun) {
    console.log('CLEANUP FUNCTION STATUS:');
    console.log(`Last execution: ${new Date(lastRun.executed_at).toLocaleString()}`);
    console.log(`Status: ${lastRun.status}`);
  } else {
    console.log('CLEANUP FUNCTION STATUS:');
    console.log('No execution records found. The function may not have run yet or logging is not enabled.');
  }
  console.log('============================================');
}

// Execute the monitoring function
monitorAnonymousUsers().catch(err => {
  console.error('Error executing monitoring script:', err);
  process.exit(1);
}); 