"use server";

import { generateUserHash } from "@/app/app/tools/actions";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  let origin = formData.get("origin") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  
  // Get session context if coming from cleaning session
  const sessionId = formData.get("sessionId") as string;
  const tempUserId = formData.get("tempUserId") as string;

  // Fallback to headers if origin is not provided or is localhost
  if (!origin || origin.includes('localhost')) {
    const headersList = await headers();
    const host = headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    if (host) {
      origin = `${protocol}://${host}`;
    }
  }

  const supabase = await createClient();

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback${sessionId ? `?sessionId=${sessionId}${tempUserId ? `&tempUserId=${tempUserId}` : ''}` : ''}`,
      data: {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Generate the user hash for this new user
  if (firstName && lastName && phoneNumber && signUpData.user) {
    try {
      // Clean the phone number and generate hash
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      const userHash = await generateUserHash(firstName, lastName, cleanPhoneNumber);
      
      // Update the user_profiles table with the generated hash
      await supabase
        .from('user_profiles')
        .update({ user_hash: userHash })
        .eq('id', signUpData.user.id);
      
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
              registered_user_id: signUpData.user.id
            })
            .eq('id', existingUser.id);
        }
      } else {
        // No existing anonymous record - create one if needed
        await supabase
          .from('anonymous_users')
          .insert([{ 
            user_hash: userHash,
            user_type: 'registered',
            first_import_at: new Date().toISOString(),
            last_import_at: new Date().toISOString(),
            registered_at: new Date().toISOString(),
            registered_user_id: signUpData.user.id,
            import_count: 0,
            unit_number: ''
          }]);
      }
      
      // If signing up from a cleaning session, create ward association
      if (sessionId) {
        try {
          // Get the ward info from the session
          const { data: sessionData, error: sessionError } = await supabase
            .from('cleaning_sessions')
            .select('ward_branch_id')
            .eq('id', sessionId)
            .single();
            
          if (sessionError) {
            console.error("Error fetching session data for ward association:", sessionError);
          } else if (sessionData?.ward_branch_id) {
            // Create ward association using the function created in Phase 1
            const { data: membershipData, error: membershipError } = await supabase
              .rpc('associate_user_with_ward', {
                p_user_id: signUpData.user.id,
                p_ward_branch_id: sessionData.ward_branch_id,
                p_role: 'member'
              });
              
            if (membershipError) {
              console.error("Error creating ward association:", membershipError);
            } else {
              console.log("Ward association created successfully:", membershipData);
            }
            
            // If there's a temp user ID, prepare to transfer anonymous activity
            if (tempUserId) {
              // Store the temp user ID to be processed after email verification
              // We'll store this in a temporary table or local storage to be processed
              // when the user completes email verification
              console.log("Temp user activity will be transferred after email verification:", tempUserId);
            }
          }
        } catch (wardError) {
          console.error("Exception during ward association:", wardError);
        }
      }
    } catch (err) {
      console.error("Error updating user hash during signup:", err);
      // Don't fail registration if hash handling fails
    }
  }

  return { success: true };
}

export async function signIn(formData: FormData) {
  let origin = formData.get("origin") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Fallback to headers if origin is not provided or is localhost
  if (!origin || origin.includes('localhost')) {
    const headersList = await headers();
    const host = headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    if (host) {
      origin = `${protocol}://${host}`;
    }
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return redirect(origin);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/");
} 