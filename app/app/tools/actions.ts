"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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