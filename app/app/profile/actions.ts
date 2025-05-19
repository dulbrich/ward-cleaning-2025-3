"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Search for wards by name or unit number
 * 
 * @param searchTerm The search term to look for
 * @returns Array of matching wards
 */
export async function searchWards(searchTerm: string) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }
    
    // Split search term into words for more flexible matching
    const terms = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
    
    if (terms.length === 0) {
      return { success: true, data: [] };
    }
    
    // Search for wards matching any of the terms
    let query = supabase
      .from('ward_branches')
      .select('*');
      
    // Add filter conditions for each term
    terms.forEach((term, index) => {
      if (index === 0) {
        query = query.or(`name.ilike.%${term}%, unit_number.ilike.%${term}%, stake_district_name.ilike.%${term}%`);
      } else {
        query = query.or(`name.ilike.%${term}%, unit_number.ilike.%${term}%, stake_district_name.ilike.%${term}%`);
      }
    });
    
    // Execute the query
    const { data, error } = await query.limit(10);
    
    if (error) {
      console.error("Error searching wards:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error in searchWards:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error searching wards"
    };
  }
}

/**
 * Transfer a user to a new ward
 * 
 * @param newWardBranchId The ID of the ward to transfer to
 * @param setPrimary Whether to set this as the primary ward (default: true)
 * @returns Result of the transfer operation
 */
export async function transferToWard(newWardBranchId: string, setPrimary: boolean = true) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }
    
    // Call the database function to transfer the user
    const { data, error } = await supabase
      .rpc('transfer_user_to_ward', {
        p_user_id: user.id,
        p_new_ward_branch_id: newWardBranchId,
        p_set_as_primary: setPrimary
      });
      
    if (error) {
      console.error("Error transferring to ward:", error);
      return { 
        success: false, 
        error: `Error transferring to ward: ${error.message}`
      };
    }
    
    return { 
      success: true, 
      message: "Successfully transferred to new ward"
    };
  } catch (error) {
    console.error("Error in transferToWard:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error transferring to ward"
    };
  }
}

/**
 * Get a user's ward memberships
 * 
 * @returns List of wards the user is a member of
 */
export async function getUserWards() {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }
    
    // Get all ward memberships for this user
    const { data, error } = await supabase
      .from('ward_branch_members')
      .select(`
        id,
        role,
        is_active,
        joined_at,
        ward_branch:ward_branches (
          id, 
          name, 
          unit_type,
          unit_number,
          stake_district_name,
          city,
          state_province,
          country
        )
      `)
      .eq('user_id', user.id)
      .order('is_active', { ascending: false });
      
    if (error) {
      console.error("Error getting user wards:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error in getUserWards:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error getting user wards"
    };
  }
} 