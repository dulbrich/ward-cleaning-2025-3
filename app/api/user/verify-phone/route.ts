import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Helper function to add CORS headers
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

/**
 * POST /api/user/verify-phone
 * 
 * This endpoint verifies a phone number with a provided verification code.
 * For demonstration purposes, it accepts any phone number with the code "123456".
 * 
 * Request body:
 * {
 *   phone_number: string, // The phone number to verify
 *   verification_code: string // The verification code sent to the phone
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   verified: boolean
 * }
 */
export async function POST(request: Request) {
  try {
    const { phone_number, verification_code } = await request.json();
    
    // Validate input
    if (!phone_number || !verification_code) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Phone number and verification code are required",
          verified: false
        },
        { 
          headers: corsHeaders(),
          status: 400 
        }
      );
    }
    
    // For demo purposes, we accept any phone number with the code "123456"
    // In a real app, you would verify against a code stored in your database
    // or sent via an SMS service
    if (verification_code === "123456") {
      // Get the currently authenticated user if available
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Update the user's profile to mark the phone as verified
        const { error } = await supabase
          .from("user_profiles")
          .update({
            is_phone_verified: true
          })
          .eq("user_id", user.id);
        
        if (error) {
          console.error("Error updating phone verification status:", error);
        }
      }
      
      return NextResponse.json(
        { 
          success: true, 
          message: "Phone number verified successfully",
          verified: true
        },
        { 
          headers: corsHeaders(),
          status: 200 
        }
      );
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid verification code",
          verified: false
        },
        { 
          headers: corsHeaders(),
          status: 400 
        }
      );
    }
  } catch (error) {
    console.error("Error verifying phone number:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to verify phone number",
        verified: false
      },
      { 
        headers: corsHeaders(),
        status: 500 
      }
    );
  }
} 