#!/usr/bin/env node

/**
 * Script to migrate existing user hashes to the new format (first 3 letters of first/last name + last 4 of phone)
 * This script should be run after updating the generateUserHash function in the codebase.
 */

const { createClient } = require('@supabase/supabase-js');
const { createHash } = require('crypto');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use the service role key for admin access
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Creates the new format anonymous identifier
 */
async function createAnonymousIdentifier(firstName, lastName, phoneNumber) {
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
 * Fetches users and updates their hashes
 */
async function migrateUserHashes() {
  try {
    console.log('Starting user hash migration...');
    
    // Fetch all users with necessary fields
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, phone_number, user_hash')
      .not('first_name', 'is', null)
      .not('last_name', 'is', null)
      .not('phone_number', 'is', null);
    
    if (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
    
    console.log(`Found ${users.length} users to update`);
    
    // Process each user
    const updates = [];
    const hashMappings = {};
    
    for (const user of users) {
      // Generate new hash
      const newHash = await createAnonymousIdentifier(
        user.first_name,
        user.last_name,
        user.phone_number
      );
      
      // Store mapping for logging
      hashMappings[user.user_id] = {
        old_hash: user.user_hash,
        new_hash: newHash,
        user_id: user.user_id,
        name: `${user.first_name} ${user.last_name}`
      };
      
      // Update database
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ user_hash: newHash })
        .eq('user_id', user.user_id);
      
      if (updateError) {
        console.error(`Error updating user ${user.user_id}: ${updateError.message}`);
      } else {
        updates.push(user.user_id);
      }
    }
    
    console.log(`Successfully updated ${updates.length} users`);
    
    // Update anonymous_users table to match new hashes
    console.log('\nUpdating anonymous_users table...');
    const { data: anonymousUsers, error: anonError } = await supabase
      .from('anonymous_users')
      .select('id, user_hash, registered_user_id');
    
    if (anonError) {
      throw new Error(`Error fetching anonymous users: ${anonError.message}`);
    }
    
    console.log(`Found ${anonymousUsers.length} anonymous user records`);
    
    // Create reverse lookup from registered_user_id to new hash
    const registeredIdToNewHash = {};
    Object.values(hashMappings).forEach(mapping => {
      registeredIdToNewHash[mapping.user_id] = mapping.new_hash;
    });
    
    // Update anonymous users with matching registered_user_id
    const anonUpdates = [];
    for (const anonUser of anonymousUsers) {
      if (anonUser.registered_user_id && registeredIdToNewHash[anonUser.registered_user_id]) {
        const newHash = registeredIdToNewHash[anonUser.registered_user_id];
        
        const { error: updateAnonError } = await supabase
          .from('anonymous_users')
          .update({ user_hash: newHash })
          .eq('id', anonUser.id);
        
        if (updateAnonError) {
          console.error(`Error updating anonymous user ${anonUser.id}: ${updateAnonError.message}`);
        } else {
          anonUpdates.push(anonUser.id);
        }
      }
    }
    
    console.log(`Successfully updated ${anonUpdates.length} anonymous user records`);
    console.log('\nMigration completed');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateUserHashes(); 