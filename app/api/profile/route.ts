import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET /api/profile - Get the current user's profile
export async function GET() {
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

    // Query user profile from database
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    if (error) {
      console.error("Error fetching user profile:", error);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Update the current user's profile
export async function PUT(request: Request) {
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
    
    const body = await request.json();
    
    // Extract fields from request
    const { 
      first_name, 
      last_name, 
      username, 
      bio, 
      phone_number,
      is_phone_verified,
      avatar_url,
      role
    } = body;
    
    // Validate required fields
    if (!first_name || !last_name || !username) {
      return NextResponse.json(
        { error: "First name, last name, and username are required" },
        { status: 400 }
      );
    }
    
    // Check if this is an admin operation and if user has permission
    if (role && role !== "user") {
      const { data: currentUser } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      
      if (!currentUser || currentUser.role !== "admin") {
        return NextResponse.json(
          { error: "Not authorized to change role" },
          { status: 403 }
        );
      }
    }
    
    // Prepare update data
    const updateData: any = {
      first_name,
      last_name,
      username,
      bio,
      updated_at: new Date().toISOString(),
    };
    
    // Only include these fields if they are provided
    if (avatar_url) updateData.avatar_url = avatar_url;
    if (phone_number) updateData.phone_number = phone_number;
    if (is_phone_verified !== undefined) updateData.is_phone_verified = is_phone_verified;
    if (role && currentUser?.role === "admin") updateData.role = role;
    
    // Update user profile
    const { data, error } = await supabase
      .from("user_profiles")
      .update(updateData)
      .eq("user_id", user.id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating profile:", error);
      
      // Check for unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 