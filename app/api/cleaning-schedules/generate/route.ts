import { createClient } from "@/utils/supabase/server";
import { eachDayOfInterval, endOfMonth, format, isSaturday, startOfMonth } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

// Define request type
interface GenerateScheduleRequest {
  ward_branch_id: string;
  months: string[]; // Array of months in "YYYY-MM" format
  default_time: string; // Time in "HH:MM:SS" format
}

// Define schedule item type
interface ScheduleItem {
  ward_branch_id: string;
  cleaning_date: string;
  cleaning_time: string;
  assigned_group: string;
}

export async function POST(request: NextRequest) {
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

    // 2. Get request body
    const requestData: GenerateScheduleRequest = await request.json();
    
    // Validate required fields
    if (!requestData.ward_branch_id || !requestData.months || !requestData.default_time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // 3. Verify user has access to this ward branch
    const { data: wardBranch, error: wardError } = await supabase
      .from('ward_branches')
      .select('*')
      .eq('id', requestData.ward_branch_id)
      .eq('user_id', user.id)
      .single();
    
    if (wardError || !wardBranch) {
      return NextResponse.json(
        { error: "Ward branch not found or access denied" },
        { status: 403 }
      );
    }
    
    // 4. Process each month to find Saturdays
    const schedulesToCreate: ScheduleItem[] = [];
    
    for (const monthStr of requestData.months) {
      // Parse month string (YYYY-MM)
      const [year, month] = monthStr.split('-').map(Number);
      const monthDate = new Date(year, month - 1); // Months are 0-indexed in JS
      
      // Get all days in the month
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const daysInMonth = eachDayOfInterval({ start, end });
      
      // Filter to get only Saturdays
      const saturdays = daysInMonth.filter(day => isSaturday(day));
      
      // Assign groups to Saturdays
      const groups = ["A", "B", "C", "D"];
      
      saturdays.forEach((saturday, index) => {
        // If it's the 5th Saturday, assign 'All' (entire ward)
        // Otherwise, assign groups in rotation: 1st Saturday -> Group A, 2nd -> Group B, etc.
        const assignedGroup = index >= 4 ? "All" : groups[index];
        
        schedulesToCreate.push({
          ward_branch_id: requestData.ward_branch_id,
          cleaning_date: format(saturday, 'yyyy-MM-dd'),
          cleaning_time: requestData.default_time,
          assigned_group: assignedGroup
        });
      });
    }
    
    // 5. Check if any of these dates already have schedules
    if (schedulesToCreate.length > 0) {
      const dates = schedulesToCreate.map(s => s.cleaning_date);
      
      const { data: existingSchedules, error: checkError } = await supabase
        .from('cleaning_schedules')
        .select('cleaning_date')
        .eq('ward_branch_id', requestData.ward_branch_id)
        .in('cleaning_date', dates);
      
      if (checkError) {
        return NextResponse.json(
          { error: "Error checking existing schedules" },
          { status: 500 }
        );
      }
      
      // Filter out dates that already have schedules
      const existingDates = new Set(existingSchedules?.map(s => s.cleaning_date) || []);
      const newSchedules = schedulesToCreate.filter(s => !existingDates.has(s.cleaning_date));
      
      // 6. Insert new schedules
      if (newSchedules.length > 0) {
        const { data: insertedData, error: insertError } = await supabase
          .from('cleaning_schedules')
          .insert(newSchedules)
          .select();
        
        if (insertError) {
          return NextResponse.json(
            { error: "Error creating schedules", details: insertError.message },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ 
          created: newSchedules.length,
          skipped: existingDates.size,
          data: insertedData
        });
      } else {
        return NextResponse.json({ 
          created: 0,
          skipped: existingDates.size,
          message: "All selected dates already have schedules" 
        });
      }
    }
    
    return NextResponse.json({ 
      created: 0,
      message: "No schedules to create" 
    });
    
  } catch (error) {
    console.error("Error generating schedules:", error);
    return NextResponse.json(
      { error: "Failed to generate schedules" },
      { status: 500 }
    );
  }
} 