"use server";

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse the request body
    const requestBody = await request.json();
    const { 
      firstName, 
      lastName, 
      username, 
      avatarUrl, 
      phoneNumber,
      isPhoneVerified,
      hasAcceptedTerms,
      smsOptIn,
      sessionContext
    } = requestBody;
    
    // Validate required fields
    if (!firstName || !lastName || !username || !hasAcceptedTerms) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Create or update the user profile
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        username: username,
        avatar_url: avatarUrl,
        phone_number: phoneNumber,
        is_phone_verified: isPhoneVerified,
        has_accepted_terms: hasAcceptedTerms,
        sms_opt_in: smsOptIn,
        sms_opt_in_at: smsOptIn ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (profileError) {
      console.error("Error creating user profile:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
    
    // Handle session context if present (for ward cleaning signup flow)
    if (sessionContext && sessionContext.sessionId) {
      try {
        // If the user is coming from a cleaning session, we need to:
        // 1. Verify the ward association was created during signup
        // 2. Transfer any anonymous activity if there was a temp user
        
        // 1. Verify ward association
        const { data: sessionData, error: sessionError } = await supabase
          .from('cleaning_sessions')
          .select('ward_branch_id')
          .eq('id', sessionContext.sessionId)
          .single();
          
        if (sessionError) {
          console.error("Error fetching session for ward association:", sessionError);
        } else if (sessionData?.ward_branch_id) {
          // Check if ward association exists, create if not
          const { data: membershipData, error: membershipError } = await supabase
            .from('ward_branch_members')
            .select('id')
            .eq('user_id', user.id)
            .eq('ward_branch_id', sessionData.ward_branch_id)
            .maybeSingle();
            
          if (membershipError) {
            console.error("Error checking ward membership:", membershipError);
          } else if (!membershipData) {
            // Create membership if it doesn't exist
            await supabase.rpc('associate_user_with_ward', {
              p_user_id: user.id,
              p_ward_branch_id: sessionData.ward_branch_id,
              p_role: 'member'
            });
          }
          
          // 2. Transfer anonymous activity if tempUserId exists
          if (sessionContext.tempUserId) {
            // Use the transfer_anonymous_activity function created in Phase 1
            const { data: transferResult, error: transferError } = await supabase
              .rpc('transfer_anonymous_activity', {
                p_temp_user_id: sessionContext.tempUserId,
                p_user_id: user.id,
                p_session_id: sessionContext.sessionId
              });
              
            if (transferError) {
              console.error("Error transferring anonymous activity:", transferError);
            } else {
              console.log("Anonymous activity transferred successfully");
            }
          }
        }
      } catch (sessionContextError) {
        console.error("Error handling session context:", sessionContextError);
        // Don't fail the profile creation if session context handling fails
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Profile created successfully",
      data: profileData 
    });
  } catch (error) {
    console.error("Unhandled error in profile creation:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }, { status: 500 });
  }
} 