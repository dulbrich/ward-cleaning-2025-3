import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Define request type
interface UpdateScheduleRequest {
  cleaning_time?: string;
  assigned_group?: string;
}

// GET handler
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;
    
    const { data, error } = await supabase
      .from('cleaning_schedules')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}

// PUT handler
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;
    const updateData: UpdateScheduleRequest = await request.json();
    
    // Validate required fields
    if (!updateData.cleaning_time && !updateData.assigned_group) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('cleaning_schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: "Failed to update schedule" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    );
  }
}

// DELETE handler
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;
    
    const { error } = await supabase
      .from('cleaning_schedules')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json(
        { error: "Failed to delete schedule" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Schedule deleted successfully" 
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
} 