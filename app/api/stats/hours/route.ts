import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "all"; // Default to all time
  
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Set range limits based on requested time period
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "all":
      default:
        // Set to a distant past date to get all records
        startDate = new Date(2020, 0, 1);
        break;
    }

    const isoStartDate = startDate.toISOString();
    console.log(`Fetching hours data for user ${user.id} from ${isoStartDate} to now (${range} range)`);
    
    // Try to use the RPC function if available
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_hours_by_day",
      { 
        user_id: user.id,
        start_date: isoStartDate
      }
    );
    
    if (!rpcError && rpcData) {
      console.log(`RPC returned ${rpcData.length} data points, total hours:`, 
        rpcData.reduce((sum: number, d: any) => sum + (parseFloat(d.hours) || 0), 0));
      return NextResponse.json(rpcData);
    }
    
    // Fallback to direct query if RPC is not available
    console.log("RPC function not available, using direct query instead");
    
    const { data: taskTimes, error: queryError } = await supabase
      .from("cleaning_session_tasks")
      .select("task_id, assigned_at, completed_at")
      .eq("assigned_to", user.id)
      .eq("status", "done")
      .not("completed_at", "is", null)
      .not("assigned_at", "is", null)
      .gte("completed_at", isoStartDate);
    
    if (queryError) {
      console.error("Error fetching task times:", queryError);
      return NextResponse.json({ error: "Failed to fetch hours data" }, { status: 500 });
    }
    
    if (!taskTimes || taskTimes.length === 0) {
      console.log("No task times found for the given criteria");
      return NextResponse.json([]);
    }
    
    console.log(`Found ${taskTimes.length} tasks with time data`);
    
    // Process the data into daily buckets
    const dailyHours = new Map();
    const dailyTasks = new Map();
    
    for (const task of taskTimes) {
      const start = new Date(task.assigned_at);
      const end = new Date(task.completed_at);
      const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      
      console.log(`Task ${task.task_id}: ${diffHours.toFixed(2)} hours (${start.toISOString()} to ${end.toISOString()})`);
      
      // Apply business rules
      if (diffHours < (1/60)) {
        console.log(`  Skipping task - less than 1 minute (${diffHours.toFixed(2)} hours)`);
        continue; // Skip if less than 1 minute
      }
      
      const hoursSpent = Math.min(diffHours, 2); // Cap at 2 hours
      const dayKey = end.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      // Add to the running totals
      dailyHours.set(dayKey, (dailyHours.get(dayKey) || 0) + hoursSpent);
      dailyTasks.set(dayKey, (dailyTasks.get(dayKey) || 0) + 1);
    }
    
    // Fill in missing days in the range
    const result = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= now) {
      const dayKey = currentDate.toISOString().split('T')[0];
      result.push({
        date: dayKey,
        hours: parseFloat((dailyHours.get(dayKey) || 0).toFixed(1)),
        tasks: dailyTasks.get(dayKey) || 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Calculate total hours to log
    const totalHours = result.reduce((sum, day) => sum + day.hours, 0);
    console.log(`Returning ${result.length} days of data with total ${totalHours.toFixed(1)} hours`);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing hours data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 