"use server";

import { OnboardingFormData } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("Profile creation API called");
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("Auth error in profile creation API:", authError);
      return NextResponse.json({ error: "Authentication error" }, { status: 401 });
    }
    
    if (!user) {
      console.error("No authenticated user found in profile creation API");
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    
    console.log("Creating profile for user:", user.id);
    
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
      console.log("Profile already exists for user:", user.id);
      // Profile already exists
      return NextResponse.json({ 
        success: true, 
        message: "Profile already exists",
        data: existingProfile
      });
    }
    
    console.log("No existing profile found, creating new profile");
    
    // Parse the request body (could be form data or JSON)
    let profileData: OnboardingFormData;
    
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      // Handle JSON request from client-side form
      profileData = await request.json();
      
      // Validate required fields
      if (!profileData.firstName || !profileData.lastName || !profileData.username) {
        return NextResponse.json({ 
          error: "First name, last name, and username are required" 
        }, { status: 400 });
      }
      
      // Validate phone verification
      if (!profileData.isPhoneVerified) {
        return NextResponse.json({ 
          error: "Phone verification is required" 
        }, { status: 400 });
      }
      
      // Validate terms acceptance
      if (!profileData.hasAcceptedTerms) {
        return NextResponse.json({ 
          error: "You must accept the terms and conditions" 
        }, { status: 400 });
      }
      
    } else {
      // Handle form data request
      const formData = await request.formData();
      const email = formData.get("email") as string;
      
      // Set default profile values if coming from form-data
      profileData = {
        firstName: "",
        lastName: "",
        username: email?.split('@')[0] || 'user',
        avatarUrl: "/images/avatars/default.png",
        phoneNumber: "",
        isPhoneVerified: false,
        hasAcceptedTerms: true
      };
    }
    
    // Create or update the user profile
    const { data, error } = await supabase
      .from("user_profiles")
      .insert({
        user_id: user.id,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        username: profileData.username,
        avatar_url: profileData.avatarUrl || "/images/avatars/default.png",
        phone_number: profileData.phoneNumber || "",
        is_phone_verified: profileData.isPhoneVerified || false,
        has_accepted_terms: profileData.hasAcceptedTerms,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error("Error creating user profile:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log("Profile successfully created:", data);
    
    // Return success
    return NextResponse.json({ 
      success: true, 
      message: "Profile created successfully",
      data
    });
    
  } catch (error) {
    console.error("Server error creating profile:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 