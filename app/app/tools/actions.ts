"use server";

import { createClient } from "@/utils/supabase/server";
import crypto from 'crypto';
import { revalidatePath } from "next/cache";

/**
 * Generates a secure hash for anonymous user identification
 */
export async function generateAnonymousHash(firstName: string, lastName: string, phoneNumber?: string): Promise<string> {
  // Make sure we have strings to work with
  firstName = (firstName || '').toString().trim();
  lastName = (lastName || '').toString().trim();
  phoneNumber = (phoneNumber || '').toString().trim();

  // If essential components are missing, return a special hash
  // This prevents errors but ensures we don't create bogus hashes
  if (!firstName || !lastName) {
    console.warn("Incomplete data for anonymous hash generation", { 
      firstName: firstName ? 'provided' : 'missing',
      lastName: lastName ? 'provided' : 'missing',
      phoneNumber: phoneNumber ? 'provided' : 'missing'
    });
    // Return a special hash that indicates incomplete data
    // We add random data to avoid collisions between different incomplete records
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    return crypto.createHash('sha256').update(`INCOMPLETE_DATA_${randomSuffix}`).digest('hex');
  }

  // Extract the required parts with defensive coding
  const firstNamePart = firstName.slice(0, Math.min(3, firstName.length)).toUpperCase();
  const lastNamePart = lastName.slice(0, Math.min(3, lastName.length)).toUpperCase();
  
  // Handle phone number or generate a substitute
  let phonePart = '0000';
  if (phoneNumber) {
    // Extract last 4 digits of phone number (remove non-numeric characters first)
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    // If we have fewer than 4 digits, use whatever we have
    phonePart = cleanPhoneNumber.length >= 4 
      ? cleanPhoneNumber.slice(-4) 
      : cleanPhoneNumber.padStart(4, '0');  // Pad with zeros if too short
  } else {
    // If no phone number provided, use first name and last name to generate a substitute
    // This ensures hashes remain unique even without phone numbers
    const nameHash = crypto.createHash('md5')
      .update(`${firstName.toLowerCase()}:${lastName.toLowerCase()}`)
      .digest('hex');
    phonePart = nameHash.slice(0, 4);
  }
  
  // Combine the parts
  const combinedString = `${firstNamePart}${lastNamePart}${phonePart}`;
  
  // Hash the combined string using SHA-256
  return crypto.createHash('sha256').update(combinedString).digest('hex');
}

/**
 * Tracks an anonymous user in the database
 */
export async function trackAnonymousUser(firstName: string, lastName: string, phoneNumber?: string) {
  try {
    console.log(`Starting trackAnonymousUser for: ${firstName} ${lastName}`);
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("User not authenticated in trackAnonymousUser");
      return { error: "Not authenticated" };
    }
    console.log(`User authenticated with ID: ${user.id.substring(0, 6)}...`);

    // Check if we have enough data to create a meaningful hash
    if (!firstName || !lastName) {
      console.warn("Incomplete data for tracking", {
        firstName: firstName ? 'provided' : 'missing',
        lastName: lastName ? 'provided' : 'missing',
        phoneNumber: phoneNumber ? 'provided' : 'missing'
      });
      return { 
        error: "Incomplete data",
        details: {
          firstName: firstName ? 'provided' : 'missing',
          lastName: lastName ? 'provided' : 'missing',
          phoneNumber: phoneNumber ? 'provided' : 'missing'
        }
      };
    }

    // Generate the anonymous hash
    console.log("Generating anonymous hash...");
    const userHash = await generateAnonymousHash(firstName, lastName, phoneNumber);
    console.log(`Generated hash: ${userHash.substring(0, 10)}...`);
    
    // Skip incomplete data hashes
    if (userHash.includes('INCOMPLETE_DATA')) {
      console.warn("Skipping incomplete data hash");
      return { error: "Skipped incomplete data", userHash };
    }
    
    // Check if this hash already exists
    console.log("Checking if user hash exists in database...");
    try {
      const { data: existingUser, error: lookupError } = await supabase
        .from('anonymous_users')
        .select('id, user_hash, import_count')
        .eq('user_hash', userHash)
        .maybeSingle();
        
      if (lookupError) {
        console.error("Error looking up anonymous user:", lookupError);
        if (lookupError.code) {
          console.error(`Error code: ${lookupError.code}, Message: ${lookupError.message}`);
          if (lookupError.code === "PGRST301") {
            console.error("This may indicate that the anonymous_users table doesn't exist");
          }
        }
        return { error: lookupError.message, details: lookupError };
      }
      
      if (existingUser) {
        console.log(`Found existing user with hash: ${userHash.substring(0, 10)}...`);
        // Update the existing record
        console.log("Updating existing record...");
        const { error: updateError } = await supabase
          .from('anonymous_users')
          .update({ 
            last_import_at: new Date().toISOString(),
            import_count: (existingUser.import_count || 1) + 1
          })
          .eq('id', existingUser.id);
          
        if (updateError) {
          console.error("Error updating anonymous user:", updateError);
          if (updateError.code) {
            console.error(`Error code: ${updateError.code}, Message: ${updateError.message}`);
          }
          return { error: updateError.message, details: updateError };
        }
        
        console.log("Successfully updated existing anonymous user");
        return { success: true, isNew: false, userHash };
      } else {
        console.log("No existing user found, creating new record...");
        // Insert a new record
        const newRecord = { 
          user_hash: userHash,
          user_type: 'imported',
          first_import_at: new Date().toISOString(),
          last_import_at: new Date().toISOString(),
          import_count: 1
        };
        console.log("New record data:", newRecord);
        
        const { data: insertData, error: insertError } = await supabase
          .from('anonymous_users')
          .insert([newRecord])
          .select();
          
        if (insertError) {
          console.error("Error inserting anonymous user:", insertError);
          if (insertError.code) {
            console.error(`Error code: ${insertError.code}, Message: ${insertError.message}`);
            if (insertError.code === "PGRST301") {
              console.error("This may indicate that the anonymous_users table doesn't exist");
            } else if (insertError.code === "23505") {
              console.error("This indicates a unique constraint violation");
            }
          }
          return { error: insertError.message, details: insertError };
        }
        
        console.log("Successfully inserted new anonymous user:", insertData);
        return { success: true, isNew: true, userHash, data: insertData };
      }
    } catch (dbError) {
      console.error("Database operation exception:", dbError);
      return { error: "Database operation failed", details: dbError };
    }
  } catch (error) {
    console.error("Exception tracking anonymous user:", error);
    return { error: "An unexpected error occurred", details: error };
  }
}

/**
 * Logs a ward data import in the database
 */
export async function logWardDataImport(recordCount: number) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Not authenticated" };
    }

    const { error } = await supabase
      .from('ward_data_imports')
      .insert([{ 
        user_id: user.id,
        record_count: recordCount,
        import_status: 'success'
      }]);

    if (error) {
      console.error("Error logging ward data import:", error);
      return { error: error.message };
    }

    // Revalidate the ward-contact-import page
    revalidatePath('/app/tools');
    
    return { success: true };
  } catch (error) {
    console.error("Exception logging ward data import:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Gets the most recent ward data import information
 */
export async function getLastWardDataImport() {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Not authenticated" };
    }
    
    // Query only records for the current user
    const { data, error } = await supabase
      .from('ward_data_imports')
      .select('imported_at, record_count')
      .eq('user_id', user.id)
      .order('imported_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching last ward data import:", error);
      return { error: error.message };
    }

    return { data: data && data.length > 0 ? data[0] : null };
  } catch (error) {
    console.error("Exception fetching last ward data import:", error);
    return { error: "An unexpected error occurred" };
  }
} 