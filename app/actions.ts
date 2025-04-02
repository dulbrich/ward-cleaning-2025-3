"use server";

import { createClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData): Promise<string> => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
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
}) => {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { error } = await supabase
    .from("user_profiles")
    .upsert({
      user_id: user.id,
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      username: profileData.username,
      avatar_url: profileData.avatarUrl,
      phone_number: profileData.phoneNumber,
      is_phone_verified: profileData.isPhoneVerified,
      has_accepted_terms: profileData.hasAcceptedTerms,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  
  if (error) {
    console.error("Error creating user profile:", error);
    throw new Error(error.message);
  }
  
  return { success: true };
};

// For other actions that should redirect, we'll use a wrapper
const redirectWithMessage = (url: string) => {
  redirect(url);
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirectWithMessage(encodedRedirect("error", "/sign-in", error.message));
    return; // This won't be reached but satisfies TypeScript
  }

  return redirect("/protected");
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
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
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
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed",
    );
  }

  return encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
