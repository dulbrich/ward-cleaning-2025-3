"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Creates the anonymous_users table if it doesn't exist
 */
export async function createAnonymousUsersTable() {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Not authenticated" };
    }
    
    // The SQL to create the anonymous_users table
    const sql = `
    CREATE TABLE IF NOT EXISTS anonymous_users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_hash TEXT UNIQUE NOT NULL,
      user_type TEXT NOT NULL DEFAULT 'imported',
      first_import_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_import_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      import_count INTEGER DEFAULT 1,
      registered_at TIMESTAMP WITH TIME ZONE,
      registered_user_id UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Enable RLS on the table
    ALTER TABLE anonymous_users ENABLE ROW LEVEL SECURITY;
    
    -- Allow authenticated users to view anonymous user records
    CREATE POLICY IF NOT EXISTS "Authenticated users can view anonymous users" 
      ON anonymous_users 
      FOR SELECT 
      USING (auth.role() = 'authenticated');
    
    -- Allow authenticated users to insert anonymous users
    CREATE POLICY IF NOT EXISTS "Authenticated users can insert anonymous users" 
      ON anonymous_users 
      FOR INSERT 
      WITH CHECK (auth.role() = 'authenticated');
    
    -- Allow authenticated users to update anonymous users
    CREATE POLICY IF NOT EXISTS "Authenticated users can update anonymous users" 
      ON anonymous_users 
      FOR UPDATE
      USING (auth.role() = 'authenticated');
    `;
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error("Error creating anonymous_users table:", error);
      
      // Check if the error is due to missing exec_sql function
      if (error.message && error.message.includes("function") && error.message.includes("does not exist")) {
        return { 
          success: false,
          error: "Missing exec_sql function. Please run the SQL manually in the Supabase SQL editor.",
          details: error,
          sql: sql
        };
      }
      
      return { 
        success: false,
        error: error.message,
        details: error,
        sql: sql
      };
    }
    
    return { 
      success: true,
      message: "anonymous_users table created successfully"
    };
  } catch (error) {
    console.error("Exception creating anonymous_users table:", error);
    return { 
      success: false,
      error: "An unexpected error occurred",
      details: error
    };
  }
} 