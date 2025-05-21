#!/usr/bin/env node

// Seed fake completed tasks for a user so the Tasks Chart has data during testing
// Usage: node scripts/seed_fake_tasks.js <USER_ID>

const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');
const { subWeeks, startOfWeek, addDays } = require('date-fns');
require('dotenv').config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const userId = process.argv[2];
if (!userId) {
  console.error('Usage: node scripts/seed_fake_tasks.js <USER_ID>');
  process.exit(1);
}

const supabase = createClient(url, key);

(async () => {
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const taskCount = Math.floor(Math.random() * 4) + 1;

    for (let j = 0; j < taskCount; j++) {
      const completed_at = addDays(weekStart, Math.floor(Math.random() * 7));
      await supabase.from('cleaning_session_tasks').insert({
        id: randomUUID(),
        session_id: randomUUID(),
        task_id: randomUUID(),
        assigned_to: userId,
        status: 'done',
        completed_at,
      });
    }
  }
  console.log('Fake tasks inserted');
})();
