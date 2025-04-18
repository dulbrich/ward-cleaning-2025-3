#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Get Supabase URL and Key from command line arguments or prompt user
async function getSupabaseCredentials() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let url = process.argv[2];
  let key = process.argv[3];

  if (!url) {
    url = await new Promise(resolve => {
      rl.question(`${colors.cyan}Enter your Supabase URL: ${colors.reset}`, resolve);
    });
  }

  if (!key) {
    key = await new Promise(resolve => {
      rl.question(`${colors.cyan}Enter your Supabase anon key: ${colors.reset}`, resolve);
    });
  }

  rl.close();
  return { url, key };
}

// Test function to verify realtime configuration
async function testRealtime({ url, key }) {
  if (!url || !key) {
    console.error(`${colors.red}${colors.bright}Error: Missing Supabase URL or key${colors.reset}`);
    process.exit(1);
  }

  console.log(`\n${colors.bright}${colors.blue}Ward Cleaning - Realtime Configuration Test${colors.reset}\n`);
  console.log(`${colors.cyan}Connecting to Supabase at ${url.substring(0, 35)}...${colors.reset}\n`);

  const supabase = createClient(url, key, {
    realtime: { 
      timeout: 60000,
      params: { eventsPerSecond: 10 } 
    }
  });

  // Step 1: Verify authentication (if possible)
  console.log(`${colors.yellow}1. Testing authentication...${colors.reset}`);
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.log(`  ${colors.red}✗ Auth error: ${authError.message}${colors.reset}`);
      console.log(`  ${colors.yellow}ℹ Continuing with anonymous access${colors.reset}`);
    } else if (user) {
      console.log(`  ${colors.green}✓ Authenticated as ${user.email || user.id}${colors.reset}`);
    } else {
      console.log(`  ${colors.yellow}ℹ No user detected, continuing with anonymous access${colors.reset}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Auth test failed: ${error.message}${colors.reset}`);
  }

  // Step 2: Check if tables exist
  console.log(`\n${colors.yellow}2. Checking if necessary tables exist...${colors.reset}`);
  const tables = [
    'cleaning_session_tasks',
    'cleaning_sessions',
    'session_participants',
    'task_viewers'
  ];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`  ${colors.red}✗ ${table}: ${error.message}${colors.reset}`);
      } else {
        console.log(`  ${colors.green}✓ ${table} (contains ${count} rows)${colors.reset}`);
      }
    } catch (error) {
      console.log(`  ${colors.red}✗ ${table}: ${error.message}${colors.reset}`);
    }
  }

  // Step 3: Test realtime subscriptions
  console.log(`\n${colors.yellow}3. Testing realtime subscriptions...${colors.reset}`);
  const testTable = 'cleaning_session_tasks';
  
  // Create a unique channel name
  const channelName = `test_channel_${Date.now()}`;
  console.log(`  Creating test channel: ${channelName}`);
  
  let connected = false;
  let receivedChanges = false;
  
  const channel = supabase
    .channel(channelName)
    .on('system', { event: 'connected' }, () => {
      connected = true;
      console.log(`  ${colors.green}✓ Connected to realtime${colors.reset}`);
    })
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: testTable 
    }, (payload) => {
      console.log(`  ${colors.green}✓ Received change: ${payload.eventType} on ${payload.table}${colors.reset}`);
      receivedChanges = true;
    })
    .subscribe((status) => {
      console.log(`  Channel status: ${status}`);
      
      if (status === 'SUBSCRIBED') {
        console.log(`  ${colors.green}✓ Successfully subscribed to channel${colors.reset}`);
        console.log(`  ${colors.cyan}ℹ Now checking publication configuration...${colors.reset}`);
        
        // Try to detect a change in the database
        checkPublication();
      } else if (status === 'CHANNEL_ERROR') {
        console.log(`  ${colors.red}✗ Error subscribing to channel${colors.reset}`);
      }
    });

  // Check publication by querying directly
  async function checkPublication() {
    try {
      const { data, error } = await supabase.rpc('get_publication_tables', {
        publication_name: 'supabase_realtime'
      });
      
      if (error) {
        console.log(`  ${colors.red}✗ Unable to check publications: ${error.message}${colors.reset}`);
        console.log(`  ${colors.yellow}ℹ You may need to run the enable_realtime.sql script${colors.reset}`);
      } else if (data) {
        console.log(`\n${colors.yellow}4. Publication configuration:${colors.reset}`);
        const tableSet = new Set(data.map(row => row.tablename));
        
        for (const table of tables) {
          if (tableSet.has(table)) {
            console.log(`  ${colors.green}✓ ${table} is in the realtime publication${colors.reset}`);
          } else {
            console.log(`  ${colors.red}✗ ${table} is NOT in the realtime publication${colors.reset}`);
          }
        }
        
        // Next steps
        console.log(`\n${colors.bright}${colors.blue}Results and Next Steps:${colors.reset}`);
        
        if (tableSet.size >= tables.length) {
          console.log(`${colors.green}✓ Supabase Realtime is correctly configured!${colors.reset}`);
        } else {
          console.log(`${colors.yellow}⚠ Some tables are missing from the realtime publication.${colors.reset}`);
          console.log(`${colors.cyan}ℹ Run the database/enable_realtime.sql script to fix this.${colors.reset}`);
        }
      }
    } catch (error) {
      console.log(`  ${colors.red}✗ Error checking publications: ${error.message}${colors.reset}`);
    }
    
    // Clean up
    setTimeout(() => {
      supabase.removeChannel(channel);
      console.log(`\n${colors.cyan}Test completed and channel removed.${colors.reset}`);
      if (!connected) {
        console.log(`${colors.red}⚠ Could not connect to realtime service!${colors.reset}`);
        console.log(`${colors.cyan}ℹ Make sure realtime is enabled in your Supabase project.${colors.reset}`);
      }
      process.exit(0);
    }, 5000);
  }
}

// Create custom RPC function to check publication tables
async function createHelperFunction({ url, key }) {
  const supabase = createClient(url, key);
  
  const { error } = await supabase.rpc('create_publication_helper_function');
  
  if (error && !error.message.includes('already exists')) {
    console.log(`${colors.yellow}Creating helper function for publication testing...${colors.reset}`);
    
    await supabase.sql(`
      CREATE OR REPLACE FUNCTION public.get_publication_tables(publication_name text)
      RETURNS TABLE(schemaname text, tablename text)
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY
        SELECT n.nspname::text, c.relname::text
        FROM pg_publication p
        JOIN pg_publication_rel pr ON p.oid = pr.prpubid
        JOIN pg_class c ON c.oid = pr.prrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE p.pubname = publication_name;
      END;
      $$;
    `);
    
    console.log(`${colors.green}✓ Helper function created${colors.reset}`);
  }
}

// Main execution
(async () => {
  try {
    const credentials = await getSupabaseCredentials();
    await createHelperFunction(credentials);
    await testRealtime(credentials);
  } catch (error) {
    console.error(`${colors.red}${colors.bright}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
})(); 