import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wardBranchId: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { wardBranchId } = await params;

    // Verify user has access to this ward
    const { data: memberData, error: memberError } = await supabase
      .from('ward_branch_members')
      .select('role')
      .eq('ward_branch_id', wardBranchId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData || !['admin', 'leader'].includes(memberData.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get participation statistics using a custom query
    // Since we don't have the view created yet, we'll build the query manually
    const { data: participationStats, error: statsError } = await supabase.rpc('get_member_participation_stats', {
      target_ward_branch_id: wardBranchId
    });

    // If the RPC function doesn't exist, we'll create a fallback query
    if (statsError && statsError.code === '42883') {
      // Fallback: Get basic participation data
      const { data: sessions, error: sessionsError } = await supabase
        .from('cleaning_sessions')
        .select(`
          id,
          session_date,
          schedule_id,
          cleaning_schedules!inner(assigned_group),
          session_participants(temp_user_id, display_name)
        `)
        .eq('ward_branch_id', wardBranchId);

      if (sessionsError) {
        console.error("Error fetching participation data:", sessionsError);
        return NextResponse.json(
          { error: "Failed to fetch participation statistics" },
          { status: 500 }
        );
      }

      // Process the data to calculate participation stats
      const stats = {};
      
      return NextResponse.json({
        success: true,
        data: {
          stats: [],
          message: "Participation statistics will be available after the database view is created"
        }
      });
    }

    if (statsError) {
      console.error("Error fetching participation stats:", statsError);
      return NextResponse.json(
        { error: "Failed to fetch participation statistics" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: participationStats || []
      }
    });

  } catch (error) {
    console.error("Error in participation stats API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 