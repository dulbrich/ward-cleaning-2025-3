"use server";

import { createClient } from "@/utils/supabase/server";
import { createHash } from "crypto";

// Define types for our objects
interface AnonymousUser {
  id?: string;
  user_hash: string;
  user_type: string;
  first_import_at: string;
  last_import_at: string;
  import_count: number;
  unit_number: string;
  registered_at?: string;
  registered_user_id?: string;
}

interface UpdateData {
  last_import_at: string;
  import_count: number;
  unit_number: string;
  user_type?: string;
  registered_at?: string;
  registered_user_id?: string;
}

/**
 * Creates an anonymous identifier for a user that can be used for tracking
 * without storing personally identifiable information.
 * 
 * @param firstName User's first name
 * @param lastName User's last name
 * @param phoneNumber User's phone number
 * @returns SHA-256 hash of the normalized identification components
 */
export async function createAnonymousIdentifier(firstName: string, lastName: string, phoneNumber: string): Promise<string> {
  try {
    // Normalize inputs: take first 3 characters of first and last name, last 4 of phone
    // First name (first 3 letters)
    const firstNamePart = firstName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
    
    // Last name (first 3 letters)
    const lastNamePart = lastName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
    
    // Phone (last 4 digits)
    const phonePart = phoneNumber.replace(/[^0-9]/g, '').slice(-4);
    
    // Create the combined identifier
    const identifier = `${firstNamePart}${lastNamePart}${phonePart}`;
    
    // Hash the combined identifier
    const hash = createHash('sha256').update(identifier).digest('hex');
    
    return hash;
  } catch (error) {
    console.error("Error creating anonymous identifier:", error);
    throw new Error("Failed to create anonymous identifier");
  }
}

/**
 * Checks if a user with the given hash is already registered
 * 
 * @param userHash The hash to check
 * @returns Object containing registered status and user ID if found
 */
async function checkForRegisteredUser(userHash: string) {
  try {
    const supabase = await createClient();
    
    // Use the database function we created to find a registered user by hash
    const { data, error } = await supabase
      .rpc('find_registered_user_by_hash', {
        hash_param: userHash
      });
      
    if (error) {
      console.error('Error checking for registered user:', error);
      return { isRegistered: false };
    }
    
    if (data) {
      return { 
        isRegistered: true, 
        userId: data
      };
    }
    
    return { isRegistered: false };
  } catch (error) {
    console.error('Error in checkForRegisteredUser:', error);
    return { isRegistered: false };
  }
}

/**
 * Tracks an anonymous user in the database using a secure hash
 * 
 * @param firstName User's first name
 * @param lastName User's last name
 * @param phoneNumber User's phone number
 * @param unitNumber The ward/branch unit number (optional)
 * @returns Result of the tracking operation
 */
export async function trackAnonymousUser(
  firstName: string, 
  lastName: string, 
  phoneNumber: string,
  unitNumber?: string
) {
  try {
    // Create an anonymous identifier for this user
    const userHash = await createAnonymousIdentifier(firstName, lastName, phoneNumber);
    
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }
    
    // Check if this hash belongs to a registered user
    const { isRegistered, userId } = await checkForRegisteredUser(userHash);
    
    // Check if this user already exists (by hash)
    const { data: existingUsers, error: checkError } = await supabase
      .from('anonymous_users')
      .select('*')
      .eq('user_hash', userHash)
      .eq('unit_number', unitNumber || '')
      .limit(1);
      
    if (checkError) {
      return { 
        success: false, 
        error: `Database error checking existing user: ${checkError.message}`
      };
    }
    
    if (existingUsers && existingUsers.length > 0) {
      // Update existing user's import count and last import time
      const updateData: UpdateData = {
        last_import_at: new Date().toISOString(),
        import_count: existingUsers[0].import_count + 1,
        unit_number: unitNumber || existingUsers[0].unit_number || ''
      };
      
      // If the user is now registered but wasn't before, update that too
      if (isRegistered && existingUsers[0].user_type !== 'registered') {
        updateData.user_type = 'registered';
        updateData.registered_at = new Date().toISOString();
        updateData.registered_user_id = userId;
      }
      
      const { error: updateError } = await supabase
        .from('anonymous_users')
        .update(updateData)
        .eq('id', existingUsers[0].id);
        
      if (updateError) {
        return { 
          success: false, 
          error: `Database error updating existing user: ${updateError.message}`
        };
      }
      
      return { 
        success: true, 
        message: "Updated existing anonymous user",
        isNew: false,
        isRegistered
      };
    }
    
    // Insert new anonymous user
    const insertData: AnonymousUser = {
      user_hash: userHash,
      user_type: isRegistered ? 'registered' : 'imported',
      first_import_at: new Date().toISOString(),
      last_import_at: new Date().toISOString(),
      import_count: 1,
      unit_number: unitNumber || ''
    };
    
    // Add registration info if applicable
    if (isRegistered) {
      insertData.registered_at = new Date().toISOString();
      insertData.registered_user_id = userId;
    }
    
    const { data: newUser, error: insertError } = await supabase
      .from('anonymous_users')
      .insert([insertData])
      .select();
      
    if (insertError) {
      return { 
        success: false, 
        error: `Database error inserting new user: ${insertError.message}`
      };
    }
    
    return { 
      success: true, 
      message: "Created new anonymous user",
      isNew: true,
      isRegistered,
      id: newUser ? newUser[0].id : undefined
    };
  } catch (error) {
    console.error("Error tracking anonymous user:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error tracking anonymous user"
    };
  }
}

/**
 * Generates a hash based on user information to use for anonymous user tracking
 * @param firstName First name of the user
 * @param lastName Last name of the user
 * @param phoneNumber Phone number of the user (unformatted, digits only)
 * @returns A hash string based on the user's information
 */
export async function generateUserHash(firstName: string, lastName: string, phoneNumber: string): Promise<string> {
  // Simply use the existing createAnonymousIdentifier function to ensure consistency
  return createAnonymousIdentifier(firstName, lastName, phoneNumber);
}

/**
 * Updates a user's profile with a generated hash based on their personal information
 * Also checks for and updates anonymous user records with this registered user's information
 * @param userId The ID of the user whose profile should be updated
 * @param firstName First name of the user
 * @param lastName Last name of the user
 * @param phoneNumber Phone number of the user (unformatted, digits only)
 * @returns Result of the operation
 */
export async function updateUserProfileWithHash(
  userId: string, 
  firstName: string, 
  lastName: string, 
  phoneNumber: string
): Promise<{ success: boolean; error?: string; debugInfo?: any }> {
  try {
    // Log input values
    console.log('Profile update attempt:');
    console.log('- User ID:', userId);
    console.log('- First Name:', firstName);
    console.log('- Last Name:', lastName);
    console.log('- Phone:', phoneNumber);
    
    // Generate the user hash
    const userHash = await generateUserHash(firstName, lastName, phoneNumber);
    
    // Log the generated hash
    console.log('Generated hash:', userHash);
    console.log('Raw identifier:', `${firstName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()}${lastName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()}${phoneNumber.replace(/[^0-9]/g, '').slice(-4)}`);
    
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('Authentication check failed: User not authenticated');
      return { 
        success: false, 
        error: "Not authenticated",
        debugInfo: {
          userHash,
          rawIdentifier: `${firstName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()}${lastName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()}${phoneNumber.replace(/[^0-9]/g, '').slice(-4)}`,
          userId,
          sessionUser: null
        }
      };
    }
    
    // Only allow users to update their own profile
    // if (user.id !== userId) {
    //   console.log('Authorization check failed: User IDs do not match');
    //   console.log('- Session user ID:', user.id);
    //   console.log('- Target user ID:', userId);
    //   return { 
    //     success: false, 
    //     error: "Unauthorized", 
    //     debugInfo: {
    //       userHash,
    //       rawIdentifier: `${firstName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()}${lastName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()}${phoneNumber.replace(/[^0-9]/g, '').slice(-4)}`,
    //       userId,
    //       sessionUserId: user.id
    //     }
    //   };
    // }
    
    // Update the user profile with the hash
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ user_hash: userHash })
      .eq('id', userId);
      
    if (updateError) {
      console.log('Database update error:', updateError.message);
      return { 
        success: false, 
        error: updateError.message,
        debugInfo: {
          userHash,
          rawIdentifier: `${firstName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()}${lastName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()}${phoneNumber.replace(/[^0-9]/g, '').slice(-4)}`,
          userId,
          sessionUserId: user.id,
          dbError: updateError.message
        }
      };
    }
    
    console.log('Profile updated successfully with hash:', userHash);
    
    // Now check for any anonymous users with this hash and update their user_type
    const { error: updateAnonError } = await supabase
      .from('anonymous_users')
      .update({ 
        user_type: 'registered',
        registered_user_id: userId,
        registered_at: new Date().toISOString()
      })
      .eq('user_hash', userHash);
    
    if (updateAnonError) {
      console.error("Error updating anonymous users:", updateAnonError.message);
      // We don't return failure here because the main profile update succeeded
    }
    
    return { 
      success: true,
      debugInfo: {
        userHash,
        rawIdentifier: `${firstName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()}${lastName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()}${phoneNumber.replace(/[^0-9]/g, '').slice(-4)}`,
        userId,
        sessionUserId: user.id
      }
    };
  } catch (error) {
    console.error("Error in updateUserProfileWithHash:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error updating user hash" 
    };
  }
}

/**
 * Clears existing anonymous users for a specific ward unit number
 * 
 * @param unitNumber The ward/branch unit number
 * @returns Result of the clear operation
 */
export async function clearAnonymousUsersByUnitNumber(unitNumber: string) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }
    
    // Delete anonymous users with this unit number
    const { error } = await supabase
      .from('anonymous_users')
      .delete()
      .eq('unit_number', unitNumber);
      
    if (error) {
      return { 
        success: false, 
        error: `Database error clearing users: ${error.message}`
      };
    }
    
    return { 
      success: true, 
      message: `Cleared anonymous users for unit number: ${unitNumber}`
    };
  } catch (error) {
    console.error("Error clearing anonymous users:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error clearing anonymous users"
    };
  }
}

/**
 * Logs a ward data import event
 * 
 * @param recordCount Number of records imported
 * @param unitNumber The ward/branch unit number (optional)
 * @returns Result of the logging operation
 */
export async function logWardDataImport(recordCount: number, unitNumber?: string) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }
    
    // Insert import record
    const { data, error } = await supabase
      .from('ward_data_imports')
      .insert([{
        user_id: user.id,
        imported_at: new Date().toISOString(),
        record_count: recordCount,
        import_status: 'success',
        unit_number: unitNumber || ''
      }])
      .select();
      
    if (error) {
      return { 
        success: false, 
        error: `Database error logging import: ${error.message}`
      };
    }
    
    return { 
      success: true, 
      data: data ? data[0] : null
    };
  } catch (error) {
    console.error("Error logging ward data import:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error logging import"
    };
  }
}

/**
 * Gets the last ward data import event
 * 
 * @returns Result containing the last import data
 */
export async function getLastWardDataImport() {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }
    
    // Get most recent import
    const { data, error } = await supabase
      .from('ward_data_imports')
      .select('*')
      .eq('user_id', user.id)
      .order('imported_at', { ascending: false })
      .limit(1);
      
    if (error) {
      return { 
        success: false, 
        error: `Database error fetching import: ${error.message}`
      };
    }
    
    return { 
      success: true, 
      data: data && data.length > 0 ? data[0] : null
    };
  } catch (error) {
    console.error("Error getting last ward data import:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error getting import data"
    };
  }
} 