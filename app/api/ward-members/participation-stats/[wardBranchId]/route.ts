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

    // Get participation statistics using direct queries instead of RPC
    // First, get all ward members with their group assignments
    const { data: memberGroups, error: groupsError } = await supabase
      .from('ward_member_groups')
      .select('user_hash, assigned_group')
      .eq('ward_branch_id', wardBranchId);

    if (groupsError) {
      console.error("Error fetching member groups:", groupsError);
      return NextResponse.json(
        { error: "Failed to fetch member group assignments" },
        { status: 500 }
      );
    }

    // Get all cleaning sessions and schedules for this ward
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('cleaning_sessions')
      .select(`
        id,
        schedule_id,
        cleaning_schedules!inner(assigned_group),
        session_participants(temp_user_id)
      `)
      .eq('ward_branch_id', wardBranchId);

    if (sessionsError) {
      console.error("Error fetching sessions data:", sessionsError);
      return NextResponse.json(
        { error: "Failed to fetch participation data" },
        { status: 500 }
      );
    }

    // Calculate participation statistics
    const stats = (memberGroups || []).map(member => {
      // Find sessions this member was assigned to (based on their group)
      const assignedSessions = (sessionsData || []).filter((session: any) => {
        const scheduleGroup = session.cleaning_schedules?.assigned_group;
        return scheduleGroup === member.assigned_group || scheduleGroup === 'All';
      });

      // Find sessions this member actually participated in
      const participatedSessions = assignedSessions.filter((session: any) => 
        session.session_participants?.some((participant: any) => 
          participant.temp_user_id === member.user_hash
        )
      );

      const totalAssigned = assignedSessions.length;
      const totalParticipated = participatedSessions.length;
      const participationPercentage = totalAssigned > 0 
        ? Math.round((totalParticipated / totalAssigned) * 100 * 10) / 10 
        : 0;

      return {
        user_hash: member.user_hash,
        total_participations: totalParticipated,
        total_assigned_sessions: totalAssigned,
        participation_percentage: participationPercentage
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: stats
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