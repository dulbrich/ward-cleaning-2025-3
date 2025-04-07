"use server";

import { generateUserHash } from "@/app/app/tools/actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const origin = formData.get("origin") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const phoneNumber = formData.get("phoneNumber") as string;

  const supabase = await createClient();

  const { data: signUpData, error } = await supabase.auth.signUp({
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
    } catch (err) {
      console.error("Error updating user hash during signup:", err);
      // Don't fail registration if hash handling fails
    }
  }

  return { success: true };
}

export async function signIn(formData: FormData) {
  const origin = formData.get("origin") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

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