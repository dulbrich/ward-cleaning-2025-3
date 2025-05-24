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

    // Get custom group assignments
    const { data: customAssignments, error: customError } = await supabase
      .from('ward_member_groups')
      .select('*')
      .eq('ward_branch_id', wardBranchId);

    if (customError) {
      console.error("Error fetching custom assignments:", customError);
      return NextResponse.json(
        { error: "Failed to fetch group assignments" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        customAssignments: customAssignments || [],
        wardBranchId
      }
    });

  } catch (error) {
    console.error("Error in group assignments API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 