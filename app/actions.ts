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
  const sessionId = formData.get("sessionId")?.toString();
  const tempUserId = formData.get("tempUserId")?.toString();
  const returnUrl = formData.get("returnUrl")?.toString();
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
        session_id: sessionId,
        temp_user_id: tempUserId,
        return_url: returnUrl
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
      
      // If there's a session ID, try to associate the user with the ward
      if (sessionId) {
        try {
          // Get the ward ID from the session
          const { data: sessionData, error: sessionError } = await supabase
            .from('cleaning_sessions')
            .select('ward_branch_id')
            .eq('id', sessionId)
            .single();
            
          if (sessionError) {
            console.error("Error fetching session for ward association:", sessionError);
          } else if (sessionData?.ward_branch_id) {
            // Associate the user with the ward
            await supabase.rpc('associate_user_with_ward', {
              p_user_id: data.user.id,
              p_ward_branch_id: sessionData.ward_branch_id,
              p_role: 'member'
            });
          }
        } catch (wardAssocError) {
          console.error("Error associating user with ward:", wardAssocError);
          // Don't fail registration if ward association fails
        }
      }
    } catch (err) {
      console.error("Error updating user hash during signup:", err);
      // Don't fail registration if hash handling fails
    }
    
    // Create success URL with session context
    const successUrl = new URL("/sign-up", getBaseUrl());
    successUrl.searchParams.set("type", "success");
    successUrl.searchParams.set("message", "Thanks for signing up! Please check your email for a verification link.");
    
    if (sessionId) {
      successUrl.searchParams.set("sessionId", sessionId);
      if (tempUserId) {
        successUrl.searchParams.set("tempUserId", tempUserId);
      }
    }
    
    return successUrl.toString();
  } else {
    // Create success URL with session context
    const successUrl = new URL("/sign-up", getBaseUrl());
    successUrl.searchParams.set("type", "success");
    successUrl.searchParams.set("message", "Thanks for signing up! Please check your email for a verification link.");
    
    if (sessionId) {
      successUrl.searchParams.set("sessionId", sessionId);
      if (tempUserId) {
        successUrl.searchParams.set("tempUserId", tempUserId);
      }
    }
    
    return successUrl.toString();
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
  const origin = formData.get("origin") as string || "/app";
  
  // Get session context if coming from cleaning session
  const sessionId = formData.get("sessionId") as string;
  const tempUserId = formData.get("tempUserId") as string;
  
  const supabase = await createClient();

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Build error URL with context preservation
    const baseUrl = await getBaseUrl();
    const errorUrl = new URL("/sign-in", baseUrl);
    errorUrl.searchParams.set("type", "error");
    errorUrl.searchParams.set("message", error.message);
    if (sessionId) {
      errorUrl.searchParams.set("sessionId", sessionId);
      if (tempUserId) {
        errorUrl.searchParams.set("tempUserId", tempUserId);
      }
    }
    if (origin) {
      errorUrl.searchParams.set("returnUrl", origin);
    }
    
    redirectWithMessage(errorUrl.toString());
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
    
    // Build onboarding URL with context preservation
    const baseUrl = await getBaseUrl();
    const onboardingUrl = new URL("/onboarding", baseUrl);
    if (sessionId) {
      onboardingUrl.searchParams.set("sessionId", sessionId);
      if (tempUserId) {
        onboardingUrl.searchParams.set("tempUserId", tempUserId);
      }
    }
    
    // Redirect to onboarding instead of protected page
    return redirect(onboardingUrl.toString());
  }

  // Handle session context for users with profiles
  if (sessionId) {
    try {
      // If the user is coming from a cleaning session and has a profile:
      // 1. Verify the ward association
      // 2. Transfer any anonymous activity if there was a temp user
      
      // Get session's ward branch ID
      const { data: sessionData, error: sessionError } = await supabase
        .from('cleaning_sessions')
        .select('ward_branch_id')
        .eq('id', sessionId)
        .single();
        
      if (sessionError) {
        console.error("Error fetching session for ward association:", sessionError);
      } else if (sessionData?.ward_branch_id) {
        // Check if ward association exists, create if not
        const { data: membershipData, error: membershipError } = await supabase
          .from('ward_branch_members')
          .select('id')
          .eq('user_id', data.user.id)
          .eq('ward_branch_id', sessionData.ward_branch_id)
          .maybeSingle();
          
        if (membershipError) {
          console.error("Error checking ward membership:", membershipError);
        } else if (!membershipData) {
          // Create membership if it doesn't exist
          await supabase.rpc('associate_user_with_ward', {
            p_user_id: data.user.id,
            p_ward_branch_id: sessionData.ward_branch_id,
            p_role: 'member'
          });
        }
        
        // Transfer anonymous activity if tempUserId exists
        if (tempUserId) {
          await supabase.rpc('transfer_anonymous_activity', {
            p_temp_user_id: tempUserId,
            p_user_id: data.user.id,
            p_session_id: sessionId
          });
        }
      }
    } catch (sessionContextError) {
      console.error("Error handling session context:", sessionContextError);
      // Continue with the login flow even if this fails
    }
    
    // Redirect to the session page
    return redirect(`/app/tasks?sessionId=${sessionId}`);
  }

  // Default redirect to the app home
  return redirect(origin || "/app");
};

// Helper function to get base URL for constructing URLs
async function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Server-side - get from request headers first
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  
  if (host) {
    return `${protocol}://${host}`;
  }
  
  // Fallback to environment variables
  return process.env.NEXT_PUBLIC_BASE_URL || 
         (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
}

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
