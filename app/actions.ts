"use server";

import { generateUserHash } from "@/app/app/tools/actions";
import { createClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData): Promise<string> => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const firstName = formData.get("firstName")?.toString();
  const lastName = formData.get("lastName")?.toString();
  const phoneNumber = formData.get("phoneNumber")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  if (!firstName || !lastName || !phoneNumber) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "First name, last name, and phone number are required",
    );
  }

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
      },
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else if (data?.user) {
    try {
      // Generate the user hash for linking with anonymous users
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      const userHash = await generateUserHash(firstName, lastName, cleanPhoneNumber);
      
      // First, update the user_profiles table with the hash
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: data.user.id,
          user_hash: userHash,
          // Include other profile fields to ensure they're set
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (profileError) {
        console.error("Error updating user profile with hash:", profileError);
      }
      
      // Check if this hash exists in anonymous_users table
      const { data: existingUser, error: lookupError } = await supabase
        .from('anonymous_users')
        .select('id, user_type')
        .eq('user_hash', userHash)
        .maybeSingle();
        
      if (lookupError) {
        console.error("Error looking up anonymous user during signup:", lookupError);
      } else if (existingUser) {
        // Update the existing anonymous user to mark as registered
        if (existingUser.user_type !== 'registered') {
          await supabase
            .from('anonymous_users')
            .update({ 
              user_type: 'registered',
              registered_at: new Date().toISOString(),
              registered_user_id: data.user.id
            })
            .eq('id', existingUser.id);
        }
      } else {
        // No existing anonymous record - create one
        await supabase
          .from('anonymous_users')
          .insert([{ 
            user_hash: userHash,
            user_type: 'registered',
            first_import_at: new Date().toISOString(),
            last_import_at: new Date().toISOString(),
            registered_at: new Date().toISOString(),
            registered_user_id: data.user.id,
            import_count: 0,
            unit_number: ''
          }]);
      }
    } catch (err) {
      console.error("Error updating user hash during signup:", err);
      // Don't fail registration if hash handling fails
    }
    
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link.",
    );
  } else {
    // Handle the case where signup succeeded but no user data was returned
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link.",
    );
  }
};

export const createUserProfileAction = async (profileData: {
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl?: string;
  phoneNumber?: string;
  isPhoneVerified?: boolean;
  hasAcceptedTerms: boolean;
  email?: string;
}) => {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  console.log("Auth status when creating profile:", user ? "User authenticated" : "No user found");
  
  if (userError) {
    console.error("Auth error when creating profile:", userError);
  }
  
  // Get user ID or try to create with placeholder ID
  let userId = user?.id;
  
  if (!userId) {
    // Store this profile data for later application when the user signs in
    // This is safer than trying to create a profile without a valid user ID
    console.log("No authenticated user found. Saving profile data for later application.");
    
    if (profileData.email) {
      // Return a special result indicating we're storing for later
      return { 
        success: false, 
        pendingProfile: true,
        message: "User authentication required. Profile data will be applied after sign-in." 
      };
    } else {
      throw new Error("User email required for pending profile");
    }
  }
  
  try {
    // Create or update the user profile with the authenticated user's ID
    const { data, error } = await supabase
      .from("user_profiles")
      .upsert({
        user_id: userId,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        username: profileData.username,
        avatar_url: profileData.avatarUrl,
        phone_number: profileData.phoneNumber,
        is_phone_verified: profileData.isPhoneVerified,
        has_accepted_terms: profileData.hasAcceptedTerms,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error("Error creating user profile:", error);
      throw new Error(error.message);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error("Exception creating user profile:", error);
    throw error;
  }
};

// For other actions that should redirect, we'll use a wrapper
const redirectWithMessage = (url: string) => {
  redirect(url);
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirectWithMessage(encodedRedirect("error", "/sign-in", error.message));
    return; // This won't be reached but satisfies TypeScript
  }
  
  // After successful sign-in, check if the user has a profile
  const { data: profileData, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", data.user.id)
    .single();
  
  // If no profile exists or there was an error finding it (except "not found" error)
  if (!profileData || (profileError && profileError.code !== "PGRST116")) {
    console.log("User needs onboarding. Redirecting to onboarding page.");
    // Redirect to onboarding instead of protected page
    return redirect("/onboarding");
  }

  return redirect("/app");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    redirectWithMessage(encodedRedirect("error", "/forgot-password", "Email is required"));
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/app/reset-password`,
  });

  if (error) {
    console.error(error.message);
    redirectWithMessage(
      encodedRedirect(
        "error",
        "/forgot-password",
        "Could not reset password",
      )
    );
    return;
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  redirectWithMessage(
    encodedRedirect(
      "success",
      "/forgot-password",
      "Check your email for a link to reset your password.",
    )
  );
};

export const resetPasswordAction = async (formData: FormData): Promise<string> => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/app/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/app/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/app/reset-password",
      "Password update failed",
    );
  }

  return encodedRedirect("success", "/app/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
