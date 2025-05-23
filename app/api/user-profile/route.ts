"use server";

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const profileData = await request.json();
    
    // Create or update the user profile in Supabase
    const { data, error } = await supabase
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
        sms_opt_in: profileData.smsOptIn,
        sms_opt_in_at: profileData.smsOptIn ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error("Error creating user profile:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get the user profile from Supabase
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    if (error && error.code !== "PGRST116") { // PGRST116 is "No rows found" error
      console.error("Error fetching user profile:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 