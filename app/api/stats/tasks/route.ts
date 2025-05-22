import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const timeRange = searchParams.get("range") || "all";
  
  try {
    const supabase = await createClient();
    
    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = user.id;
    
    // Calculate date ranges based on selected time range
    const now = new Date();
    let startDate: Date | null = null;
    
    switch (timeRange) {
      case "week":
        // Past 7 days
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        // Past 30 days
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
      case "year":
        // Past 365 days
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 365);
        break;
      case "all":
      default:
        // All time - no need to set startDate
        break;
    }

    // Build the query
    let query = supabase
      .from("cleaning_session_tasks")
      .select("completed_at")
      .eq("assigned_to", userId)
      .eq("status", "done")
      .not("completed_at", "is", null);
    
    // Add date filter if a range is selected
    if (startDate) {
      query = query.gte("completed_at", startDate.toISOString());
    }

    // Execute the query
    const { data: tasks, error } = await query;

    if (error) {
      console.error("Error fetching task data:", error);
      return NextResponse.json(
        { error: "Failed to fetch task data" },
        { status: 500 }
      );
    }

    // Process the data to group by day
    const tasksByDay = new Map<string, number>();
    
    // Ensure we have data for all days in the range
    if (startDate && timeRange !== "all") {
      const current = new Date(startDate);
      while (current <= now) {
        const dateKey = current.toISOString().split("T")[0];
        tasksByDay.set(dateKey, 0);
        current.setDate(current.getDate() + 1);
      }
    }

    // Count tasks by day
    tasks.forEach((task) => {
      const dateStr = new Date(task.completed_at).toISOString().split("T")[0];
      const count = tasksByDay.get(dateStr) || 0;
      tasksByDay.set(dateStr, count + 1);
    });

    // Convert the Map to an array of objects
    const formattedData = Array.from(tasksByDay.entries())
      .map(([date, tasks]) => ({
        date,
        tasks,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error in tasks API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 