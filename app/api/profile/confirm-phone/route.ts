import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

// POST /api/profile/confirm-phone - Verify phone with code
export async function POST(request: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { phone_number, code } = await request.json();
    
    if (!phone_number || !code) {
      return NextResponse.json(
        { error: "Phone number and verification code are required" },
        { status: 400 }
      );
    }
    
    const supabase = createClient();
    
    // Get verification record from database
    const { data: verification, error: fetchError } = await supabase
      .from("phone_verifications")
      .select("*")
      .eq("user_id", userId)
      .eq("phone_number", phone_number)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (fetchError || !verification) {
      console.error("Error fetching verification:", fetchError);
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 }
      );
    }
    
    // Check if code is expired
    if (new Date() > new Date(verification.expires_at)) {
      return NextResponse.json(
        { error: "Verification code has expired" },
        { status: 400 }
      );
    }
    
    // Check if code matches
    if (verification.code !== code) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }
    
    // Mark verification as verified
    const { error: updateVerificationError } = await supabase
      .from("phone_verifications")
      .update({ verified: true })
      .eq("id", verification.id);
    
    if (updateVerificationError) {
      console.error("Error updating verification:", updateVerificationError);
      return NextResponse.json(
        { error: "Failed to verify phone" },
        { status: 500 }
      );
    }
    
    // Update user profile with new verified phone
    const { error: updateProfileError } = await supabase
      .from("user_profiles")
      .update({
        phone_number,
        is_phone_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);
    
    if (updateProfileError) {
      console.error("Error updating profile:", updateProfileError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: "Phone number verified successfully",
      phone_number
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 