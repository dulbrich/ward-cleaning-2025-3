"use server";

import { generateAnonymousHash } from "@/app/app/tools/actions";
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

  const { error } = await supabase.auth.signUp({
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

  // Check if this user was previously imported by generating the anonymous hash
  if (firstName && lastName) {
    try {
      const userHash = await generateAnonymousHash(firstName, lastName, phoneNumber);
      
      // Check if the hash exists in anonymous_users table
      const { data: existingUser, error: lookupError } = await supabase
        .from('anonymous_users')
        .select('id, user_type')
        .eq('user_hash', userHash)
        .maybeSingle();
        
      if (lookupError) {
        console.error("Error looking up anonymous user during signup:", lookupError);
      } else if (existingUser) {
        // Get the authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          if (existingUser.user_type === 'imported') {
            // Update the existing record to mark as registered
            await supabase
              .from('anonymous_users')
              .update({ 
                user_type: 'registered',
                registered_at: new Date().toISOString(),
                registered_user_id: user.id
              })
              .eq('id', existingUser.id);
          }
        }
      } else {
        // This user wasn't imported before - create a new anonymous record
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          await supabase
            .from('anonymous_users')
            .insert([{ 
              user_hash: userHash,
              user_type: 'registered',
              registered_at: new Date().toISOString(),
              registered_user_id: user.id,
              import_count: 0
            }]);
        }
      }
    } catch (err) {
      console.error("Error tracking anonymous user during signup:", err);
      // Don't fail registration if tracking fails
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