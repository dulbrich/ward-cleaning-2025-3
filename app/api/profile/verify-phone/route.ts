import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

// Function to generate a 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/profile/verify-phone - Send verification code to phone
export async function POST(request: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
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
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 3); // Code expires in 3 minutes
    
    const supabase = createClient();
    
    // Store verification code in database
    // In a real app, you would use a proper verification service like Twilio or similar
    const { error } = await supabase
      .from("phone_verifications")
      .upsert({
        user_id: userId,
        phone_number,
        code: verificationCode,
        expires_at: expiresAt.toISOString(),
        verified: false
      });
    
    if (error) {
      console.error("Error storing verification code:", error);
      return NextResponse.json(
        { error: "Failed to initiate verification" },
        { status: 500 }
      );
    }
    
    // In a real application, you would send SMS here
    // For development, we'll just log the code
    console.log(`Verification code for ${phone_number}: ${verificationCode}`);
    
    return NextResponse.json({
      message: "Verification code sent successfully",
      // Include this for development only, remove in production
      code: process.env.NODE_ENV === "development" ? verificationCode : undefined
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 