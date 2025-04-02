// Server-side component
import { Message } from "@/components/form-message";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ClientProfile from "./client-profile";

// Helper function to get user profile (server component)
async function getUserProfile(userId: string) {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    
    if (error) {
      // Check if it's a "not found" error, which is ok
      if (error.code === "PGRST116") {
        console.log("No user profile found for user:", userId);
        return null;
      }
      
      // Otherwise it's an unexpected error
      console.error("Error fetching user profile:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Exception fetching user profile:", error);
    return null;
  }
}

// Server component wrapper
export default async function ProtectedPage({
  searchParams
}: {
  searchParams?: { 
    type?: string;
    message?: string;
  };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }
  
  // Get the user's profile
  const profile = await getUserProfile(user.id);
  
  // Build message from search params if present
  let message: Message | null = null;
  
  if (searchParams?.type && searchParams?.message) {
    if (searchParams.type === 'error') {
      message = { error: searchParams.message };
    } else if (searchParams.type === 'success') {
      message = { success: searchParams.message };
    } else {
      message = { message: searchParams.message };
    }
  }

  // Use client component for the UI
  return <ClientProfile user={user} serverProfile={profile} searchParamsMessage={message} />;
} 