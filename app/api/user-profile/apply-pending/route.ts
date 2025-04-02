"use server";

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("Apply pending profile API called");
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("Auth error in apply pending profile API:", authError);
      return NextResponse.json({ error: "Authentication error" }, { status: 401 });
    }
    
    if (!user) {
      console.error("No authenticated user found in apply pending profile API");
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    
    // Parse pending profile data from request body
    let pendingData;
    try {
      const formData = await request.formData();
      const pendingProfileJson = formData.get('pendingProfileData') as string;
      
      if (!pendingProfileJson) {
        return NextResponse.json({ error: "No profile data provided" }, { status: 400 });
      }
      
      pendingData = JSON.parse(pendingProfileJson);
      console.log("Parsed pending profile data:", pendingData);
    } catch (parseError) {
      console.error("Error parsing pending profile data:", parseError);
      return NextResponse.json({ error: "Invalid profile data format" }, { status: 400 });
    }
    
    // Check if a profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking for existing profile:", checkError);
    }
      
    if (existingProfile) {
      console.log("Profile already exists for user, updating:", user.id);
      // Update existing profile with pending data
      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          first_name: pendingData.firstName || existingProfile.first_name,
          last_name: pendingData.lastName || existingProfile.last_name,
          username: pendingData.username || existingProfile.username,
          avatar_url: pendingData.avatarUrl || existingProfile.avatar_url,
          phone_number: pendingData.phoneNumber || existingProfile.phone_number,
          is_phone_verified: pendingData.isPhoneVerified !== undefined ? pendingData.isPhoneVerified : existingProfile.is_phone_verified,
          has_accepted_terms: pendingData.hasAcceptedTerms !== undefined ? pendingData.hasAcceptedTerms : existingProfile.has_accepted_terms,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select();
      
      if (error) {
        console.error("Error updating profile with pending data:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, data, message: "Profile updated with saved data" });
    } else {
      console.log("No existing profile found, creating new profile with pending data");
      
      // Create a new profile with pending data
      const { data, error } = await supabase
        .from("user_profiles")
        .insert({
          user_id: user.id,
          first_name: pendingData.firstName || "",
          last_name: pendingData.lastName || "",
          username: pendingData.username || user.email?.split('@')[0] || 'user',
          avatar_url: pendingData.avatarUrl || "/images/avatars/default.png",
          phone_number: pendingData.phoneNumber || "",
          is_phone_verified: pendingData.isPhoneVerified || false,
          has_accepted_terms: pendingData.hasAcceptedTerms || true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error("Error creating profile with pending data:", error);
        return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, data, message: "Profile created with saved data" });
    }
  } catch (error) {
    console.error("Server error in apply pending profile API:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 