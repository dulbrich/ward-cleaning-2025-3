import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { taskId, assignToUserId, assignToTempUserId } = body;
    
    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }
    
    if (!assignToUserId && !assignToTempUserId) {
      return NextResponse.json({ error: "Either assignToUserId or assignToTempUserId must be provided" }, { status: 400 });
    }
    
    console.log("Server-side task assignment request:", { taskId, assignToUserId, assignToTempUserId });
    
    // Create server-side Supabase client
    const supabase = await createClient();
    
    // Try to get complete task info first
    const { data: taskInfo, error: infoError } = await supabase
      .from("cleaning_session_tasks")
      .select("id, status, session_id")
      .eq("id", taskId)
      .single();
      
    if (infoError) {
      console.error("Error fetching task:", infoError);
      return NextResponse.json({ 
        error: "Task not found", 
        details: infoError
      }, { status: 404 });
    }
    
    if (taskInfo.status !== "todo") {
      return NextResponse.json({ 
        error: "Task is already claimed", 
        status: taskInfo.status 
      }, { status: 409 });
    }
    
    // Prepare update data with proper typing
    const now = new Date().toISOString();
    const updateData: {
      status: string;
      assigned_at: string;
      updated_at: string;
      assigned_to: string | null;
      assigned_to_temp_user: string | null;
    } = {
      status: "doing",
      assigned_at: now,
      updated_at: now,
      assigned_to: null,
      assigned_to_temp_user: null
    };
    
    // Add the appropriate assignment field
    if (assignToUserId) {
      updateData.assigned_to = assignToUserId;
      updateData.assigned_to_temp_user = null;
    } else {
      updateData.assigned_to = null;
      updateData.assigned_to_temp_user = assignToTempUserId;
    }
    
    console.log("Updating task with data:", updateData);
    
    // Try direct SQL update to avoid any potential issues with the REST API
    const { data, error } = await supabase
      .from("cleaning_session_tasks")
      .update(updateData)
      .eq("id", taskId)
      .select();
      
    if (error) {
      console.error("Error updating task:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      return NextResponse.json({ 
        error: "Failed to assign task",
        details: error
      }, { status: 500 });
    }
    
    console.log("Task assignment successful:", data);
    
    // Get participant information for the UI
    let participantInfo = null;
    
    if (assignToUserId) {
      const { data: participant } = await supabase
        .from("session_participants")
        .select("display_name, avatar_url")
        .eq("user_id", assignToUserId)
        .eq("session_id", taskInfo.session_id)
        .single();
        
      if (participant) {
        participantInfo = participant;
      }
    } else if (assignToTempUserId) {
      const { data: participant } = await supabase
        .from("session_participants")
        .select("display_name, avatar_url")
        .eq("temp_user_id", assignToTempUserId)
        .eq("session_id", taskInfo.session_id)
        .single();
        
      if (participant) {
        participantInfo = participant;
      }
    }
    
    return NextResponse.json({ 
      message: "Task assigned successfully",
      task: data[0],
      assignee: participantInfo
    });
  } catch (error) {
    console.error("Unexpected error during task assignment:", error);
    
    return NextResponse.json({ 
      error: "An unexpected error occurred",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 