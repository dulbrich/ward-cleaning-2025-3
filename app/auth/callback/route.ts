import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();
  
  // Get session context if coming from cleaning session
  const sessionId = requestUrl.searchParams.get("sessionId");
  const tempUserId = requestUrl.searchParams.get("tempUserId");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // Build onboarding URL with session context if available
  let onboardingUrl = `${origin}/onboarding?type=success&message=Email verified successfully. Please complete your profile.`;
  
  if (sessionId) {
    onboardingUrl += `&sessionId=${sessionId}`;
    if (tempUserId) {
      onboardingUrl += `&tempUserId=${tempUserId}`;
    }
  }

  // URL to redirect to after sign up process completes - direct to onboarding
  // Include a message for the user that email verification was successful
  return NextResponse.redirect(onboardingUrl);
}
