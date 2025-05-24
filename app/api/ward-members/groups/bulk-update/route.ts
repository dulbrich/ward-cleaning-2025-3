import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface BulkUpdateRequest {
  wardBranchId: string;
  assignments: {
    userHash: string;
    newGroup: 'A' | 'B' | 'C' | 'D';
    householdId: string;
  }[];
}

export async function POST(request: NextRequest) {
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

    const body: BulkUpdateRequest = await request.json();
    const { wardBranchId, assignments } = body;

    if (!wardBranchId || !assignments || !Array.isArray(assignments)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Verify user has admin access to this ward
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

    // Prepare the assignments for upsert
    const assignmentsToUpsert = assignments.map(assignment => ({
      ward_branch_id: wardBranchId,
      user_hash: assignment.userHash,
      assigned_group: assignment.newGroup,
      household_id: assignment.householdId,
      assigned_by: user.id,
      assignment_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Perform bulk upsert
    const { data, error } = await supabase
      .from('ward_member_groups')
      .upsert(assignmentsToUpsert, {
        onConflict: 'ward_branch_id,user_hash'
      });

    if (error) {
      console.error("Error updating group assignments:", error);
      return NextResponse.json(
        { error: "Failed to update group assignments" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: assignments.length,
        assignments: data
      }
    });

  } catch (error) {
    console.error("Error in bulk update API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 