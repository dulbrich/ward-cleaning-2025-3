"use server";

import { generateAnonymousHash } from "@/app/app/tools/actions";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Interface for contact data
 */
export interface Contact {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  head?: boolean | string;
  isHead?: boolean | string;
  headOfHousehold?: boolean | string;
  householdRole?: string;
  userType?: 'imported' | 'registered' | 'unknown';
  doNotContact?: boolean;
  userHash?: string;
}

/**
 * Check if a list of contacts have do-not-contact status
 */
export async function checkDoNotContactStatus(contacts: Contact[]): Promise<Contact[]> {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("User not authenticated in checkDoNotContactStatus");
      return contacts;
    }
    
    console.log(`Checking do-not-contact status for ${contacts.length} contacts`);
    
    // Track hash collisions for debugging
    const hashMap: Record<string, string[]> = {};
    
    // Generate hashes for each contact and check status
    const contactsWithHashes = await Promise.all(contacts.map(async (contact) => {
      if (!contact.name || !contact.phone) {
        return { ...contact, userType: 'unknown' as const, doNotContact: false };
      }
      
      // Extract first and last name
      const nameParts = contact.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      
      // Generate hash for this contact
      const userHash = await generateAnonymousHash(firstName, lastName, contact.phone);
      
      // Track hashes for collision detection
      if (!hashMap[userHash]) {
        hashMap[userHash] = [];
      }
      hashMap[userHash].push(contact.name);
      
      return { ...contact, userHash };
    }));
    
    // Log any hash collisions
    Object.entries(hashMap).forEach(([hash, names]) => {
      if (names.length > 1) {
        console.warn(`Hash collision detected for ${hash.substring(0, 10)}... with ${names.length} contacts:`, names);
      }
    });
    
    // Get all user hashes
    const userHashes = contactsWithHashes
      .map(contact => contact.userHash)
      .filter(Boolean) as string[];
    
    if (userHashes.length === 0) {
      return contacts;
    }
    
    // Check which hashes are in do_not_contact table (only need the hash field)
    const { data: doNotContactData, error: doNotContactError } = await supabase
      .from('do_not_contact')
      .select('user_hash')
      .in('user_hash', userHashes);
      
    if (doNotContactError) {
      console.error("Error fetching do_not_contact status:", doNotContactError);
      return contactsWithHashes;
    }
    
    // Create a set of do-not-contact hashes for quick lookup
    const doNotContactHashes = new Set(doNotContactData?.map(item => item.user_hash) || []);
    console.log(`Found ${doNotContactHashes.size} contacts marked as do-not-contact`);
    
    // Check which hashes are in anonymous_users table
    const { data: anonymousUsersData, error: anonymousUsersError } = await supabase
      .from('anonymous_users')
      .select('user_hash, user_type')
      .in('user_hash', userHashes);
      
    if (anonymousUsersError) {
      console.error("Error fetching anonymous_users data:", anonymousUsersError);
    }
    
    // Create a map of user types by hash
    const userTypeMap = new Map();
    anonymousUsersData?.forEach(item => {
      userTypeMap.set(item.user_hash, item.user_type);
    });
    
    // Add do-not-contact and user type information to contacts
    return contactsWithHashes.map(contact => {
      if (!contact.userHash) return contact;
      
      const doNotContact = doNotContactHashes.has(contact.userHash);
      const userType = userTypeMap.get(contact.userHash) || 'unknown';
      
      return {
        ...contact,
        doNotContact,
        userType
      };
    });
  } catch (error) {
    console.error("Exception in checkDoNotContactStatus:", error);
    return contacts;
  }
}

/**
 * Toggle do-not-contact status for a contact
 */
export async function toggleDoNotContactStatus(
  contact: Contact,
  doNotContact: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    if (!contact.name || !contact.phone || !contact.userHash) {
      return { 
        success: false, 
        message: "Insufficient contact data" 
      };
    }
    
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { 
        success: false, 
        message: "Not authenticated" 
      };
    }
    
    if (doNotContact) {
      // Add to do_not_contact table - storing only the hash, no PII
      const { error } = await supabase
        .from('do_not_contact')
        .insert([{
          user_hash: contact.userHash,
          marked_by: user.id,
          marked_at: new Date().toISOString()
        }]);
        
      if (error) {
        console.error("Error adding to do_not_contact:", error);
        return {
          success: false,
          message: error.message
        };
      }
    } else {
      // Remove from do_not_contact table
      const { error } = await supabase
        .from('do_not_contact')
        .delete()
        .eq('user_hash', contact.userHash);
        
      if (error) {
        console.error("Error removing from do_not_contact:", error);
        return {
          success: false,
          message: error.message
        };
      }
    }
    
    // Revalidate the contacts page
    revalidatePath('/app/contacts');
    
    return {
      success: true,
      message: doNotContact ? 
        "Contact added to do-not-contact list" :
        "Contact removed from do-not-contact list"
    };
  } catch (error) {
    console.error("Exception in toggleDoNotContactStatus:", error);
    return {
      success: false,
      message: "An unexpected error occurred"
    };
  }
} 