import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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

    // 2. Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const ward_branch_id = searchParams.get('ward_branch_id');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    
    // 3. Verify user has access to the ward branch
    if (ward_branch_id) {
      const { data: wardBranch, error: wardError } = await supabase
        .from('ward_branches')
        .select('*')
        .eq('id', ward_branch_id)
        .eq('user_id', user.id)
        .single();
      
      if (wardError || !wardBranch) {
        return NextResponse.json(
          { error: "Ward branch not found or access denied" },
          { status: 403 }
        );
      }
    }
    
    // 4. Build query for cleaning schedules
    let query = supabase
      .from('cleaning_schedules')
      .select('*');
    
    // 4.1 Apply ward_branch_id filter if provided
    if (ward_branch_id) {
      query = query.eq('ward_branch_id', ward_branch_id);
    } else {
      // If no specific ward is requested, get all schedules for wards the user has access to
      const { data: userWards, error: wardsError } = await supabase
        .from('ward_branches')
        .select('id')
        .eq('user_id', user.id);
      
      if (wardsError) {
        return NextResponse.json(
          { error: "Failed to retrieve user's wards" },
          { status: 500 }
        );
      }
      
      const wardIds = userWards?.map(ward => ward.id) || [];
      if (wardIds.length === 0) {
        // User has no wards, return empty array
        return NextResponse.json([]);
      }
      
      query = query.in('ward_branch_id', wardIds);
    }
    
    // 4.2 Apply date range filters if provided
    if (start_date) {
      query = query.gte('cleaning_date', start_date);
    }
    
    if (end_date) {
      query = query.lte('cleaning_date', end_date);
    }
    
    // 4.3 Order by date
    query = query.order('cleaning_date');
    
    // 5. Execute query
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch schedules", details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
} 