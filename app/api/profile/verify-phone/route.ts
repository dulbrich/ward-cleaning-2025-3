import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Generate a random verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/profile/verify-phone - Start phone verification process
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { phone_number } = await request.json();
    
    if (!phone_number) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Generate verification code
    const code = generateVerificationCode();
    
    // Code expires in 15 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    
    // Create verification record
    const { error } = await supabase
      .from("phone_verifications")
      .upsert({
        user_id: user.id,
        phone_number,
        verification_code: code,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error("Error creating verification:", error);
      return NextResponse.json(
        { error: "Failed to start verification" },
        { status: 500 }
      );
    }
    
    // In a real application, this would send an SMS via a service like Twilio
    // For the demo, we'll just return the code in the response
    
    return NextResponse.json({
      message: "Verification code sent",
      debug_code: code // Remove this in production
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 