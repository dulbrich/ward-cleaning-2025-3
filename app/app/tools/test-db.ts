"use server";

import { createClient } from "@/utils/supabase/server";
import { trackAnonymousUser } from "./actions";

/**
 * Checks if the anonymous_users table exists and is accessible
 */
export async function checkAnonymousUsersTable() {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Not authenticated" };
    }
    
    // Try to query the table
    const { data, error } = await supabase
      .from('anonymous_users')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error("Error checking anonymous_users table:", error);
      
      if (error.code === "42P01") {
        return { 
          exists: false,
          message: "The anonymous_users table doesn't exist. Create it using the SQL in IMPORTS.md",
          error
        };
      }
      
      if (error.code === "42501") {
        return { 
          exists: false,
          message: "Permission denied. Check the RLS policies for the anonymous_users table.",
          error
        };
      }
      
      return { 
        exists: false,
        message: error.message,
        error
      };
    }
    
    return { 
      exists: true,
      message: "anonymous_users table exists and is accessible"
    };
  } catch (error) {
    console.error("Exception checking anonymous_users table:", error);
    return { 
      exists: false,
      message: "An unexpected error occurred while checking the anonymous_users table",
      error
    };
  }
}

/**
 * Tests tracking a ward member from JSON data
 */
export async function testTrackWardMember(memberData: any) {
  try {
    if (!memberData) {
      return { error: "No member data provided" };
    }
    
    // Extract the name information
    const firstName = memberData.givenName || memberData.firstName || '';
    const lastName = memberData.surname || memberData.lastName || '';
    
    // Handle the nested phone structure
    let phone = '';
    if (memberData.phone) {
      if (typeof memberData.phone === 'string') {
        phone = memberData.phone;
      } else if (typeof memberData.phone === 'object') {
        // Extract from nested structure
        if (memberData.phone.number) {
          phone = memberData.phone.number;
        } else if (memberData.phone.e164) {
          phone = memberData.phone.e164;
        }
      }
    }
    
    // Log the data we're working with
    console.log(`Testing tracking for: ${firstName} ${lastName}`);
    console.log(`Phone data available: ${!!phone}`, phone ? `(${phone})` : '');
    
    if (!firstName || !lastName) {
      return { 
        success: false,
        error: "Incomplete member data", 
        details: {
          firstName: firstName ? 'provided' : 'missing',
          lastName: lastName ? 'provided' : 'missing',
          phone: phone ? 'provided' : 'missing'
        }
      };
    }
    
    // Try to track this member
    const result = await trackAnonymousUser(firstName, lastName, phone);
    return result;
    
  } catch (error) {
    console.error("Exception testing ward member tracking:", error);
    return { 
      success: false,
      error: "An unexpected error occurred while testing ward member tracking",
      details: error
    };
  }
}

/**
 * Creates a test record in the anonymous_users table
 */
export async function createTestAnonymousUser() {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Not authenticated" };
    }
    
    // Generate a test hash
    const testHash = `test_${Date.now()}`;
    
    // Try to insert a test record
    const { data, error } = await supabase
      .from('anonymous_users')
      .insert([{
        user_hash: testHash,
        user_type: 'test',
        first_import_at: new Date().toISOString(),
        last_import_at: new Date().toISOString(),
        import_count: 1
      }])
      .select();
    
    if (error) {
      console.error("Error creating test record:", error);
      
      if (error.code === "42P01") {
        return { 
          success: false,
          error: "Table does not exist",
          action: "Please create the anonymous_users table using the SQL in IMPORTS.md",
          details: error
        };
      }
      
      if (error.code === "42501") {
        return { 
          success: false,
          error: "Permission denied",
          action: "Check RLS policies for the anonymous_users table",
          details: error
        };
      }
      
      return { 
        success: false,
        error: error.message,
        details: error
      };
    }
    
    return { 
      success: true,
      message: "Test record created successfully",
      data
    };
  } catch (error) {
    console.error("Exception creating test record:", error);
    return { 
      success: false,
      error: "An unexpected error occurred",
      details: error
    };
  }
} 