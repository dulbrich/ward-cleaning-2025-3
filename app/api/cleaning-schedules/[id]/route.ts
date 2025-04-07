import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Define request type
interface UpdateScheduleRequest {
  cleaning_time?: string;
  assigned_group?: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Get schedule ID from params
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: "Missing schedule ID" },
        { status: 400 }
      );
    }

    // 3. Get request body
    const updateData: UpdateScheduleRequest = await request.json();
    
    // Validate that at least one field is being updated
    if (!updateData.cleaning_time && !updateData.assigned_group) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }
    
    // 4. Verify user has access to this schedule through ward branch
    const { data: schedule, error: fetchError } = await supabase
      .from('cleaning_schedules')
      .select('*, ward_branches!inner(*)')
      .eq('id', id)
      .single();
    
    if (fetchError || !schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }
    
    // Check if the user owns the ward branch
    if (schedule.ward_branches.user_id !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to update this schedule" },
        { status: 403 }
      );
    }
    
    // 5. Update the schedule
    const { data: updatedSchedule, error: updateError } = await supabase
      .from('cleaning_schedules')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update schedule", details: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedSchedule[0]);
    
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Get schedule ID from params
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: "Missing schedule ID" },
        { status: 400 }
      );
    }

    // 3. Verify user has access to this schedule through ward branch
    const { data: schedule, error: fetchError } = await supabase
      .from('cleaning_schedules')
      .select('*, ward_branches!inner(*)')
      .eq('id', id)
      .single();
    
    if (fetchError || !schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }
    
    // Check if the user owns the ward branch
    if (schedule.ward_branches.user_id !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this schedule" },
        { status: 403 }
      );
    }
    
    // 4. Delete the schedule
    const { error: deleteError } = await supabase
      .from('cleaning_schedules')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete schedule", details: deleteError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Schedule deleted successfully" 
    });
    
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
} 