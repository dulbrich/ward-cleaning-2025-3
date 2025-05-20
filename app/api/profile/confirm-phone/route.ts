import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// POST /api/profile/confirm-phone - Confirm a phone verification code
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

    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    // Get the current verification code and phone number for this user
    const { data: verificationData, error: verificationError } = await supabase
      .from("phone_verifications")
      .select("phone_number, verification_code, expires_at")
      .eq("user_id", user.id)
      .single();
    
    if (verificationError || !verificationData) {
      return NextResponse.json(
        { error: "No verification in progress" },
        { status: 404 }
      );
    }
    
    // Check if code is expired
    if (new Date(verificationData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Verification code has expired" },
        { status: 400 }
      );
    }
    
    // Check if code matches
    if (verificationData.verification_code !== code) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }
    
    // Mark phone as verified in user_profiles
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        phone_number: verificationData.phone_number,
        is_phone_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);
    
    if (updateError) {
      console.error("Error updating user profile:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }
    
    // Delete the verification record
    await supabase
      .from("phone_verifications")
      .delete()
      .eq("user_id", user.id);
    
    return NextResponse.json({
      success: true,
      message: "Phone number successfully verified",
      phone_number: verificationData.phone_number
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 