import { createClient } from "@/utils/supabase/server";

export interface UserStats {
  lifetimePoints: number;
  tasksCompleted: number;
  hoursSpent: number;
  daysParticipated: number;
  bestStreak: number;
}

export async function fetchUserStats(userId: string): Promise<UserStats> {
  const supabase = await createClient();

  const { data: pointsRows } = await supabase
    .from("user_points")
    .select("points")
    .eq("user_id", userId);

  const lifetimePoints =
    pointsRows?.reduce((sum, row) => sum + ((row as any).points as number), 0) || 0;

  const { count: tasksCompleted } = await supabase
    .from("cleaning_session_tasks")
    .select("id", { count: "exact", head: true })
    .eq("assigned_to", userId)
    .eq("status", "done");

  const { data: sessions } = await supabase
    .from("cleaning_session_tasks")
    .select("session_id")
    .eq("assigned_to", userId)
    .eq("status", "done");

  const uniqueSessions = new Set<string>();
  sessions?.forEach((row: any) => uniqueSessions.add(row.session_id));

  // Calculate total hours spent
  let hoursSpent = 0;
  
  try {
    console.log(`Calculating hours spent for user: ${userId}`);
    // Try the RPC function if available
    const { data: timeData, error: timeError } = await supabase.rpc(
      "calculate_user_hours",
      { user_id: userId }
    );
    
    if (!timeError && timeData) {
      hoursSpent = parseFloat(timeData.total_hours) || 0;
      console.log(`Hours from RPC: ${hoursSpent}`);
    } else {
      console.log("RPC failed or returned no data, falling back to manual calculation");
      // Fallback calculation if the RPC isn't available
      const { data: taskTimes, error } = await supabase
        .from("cleaning_session_tasks")
        .select("assigned_at, completed_at")
        .eq("assigned_to", userId)
        .eq("status", "done")
        .not("completed_at", "is", null)
        .not("assigned_at", "is", null);
        
      if (!error && taskTimes && taskTimes.length > 0) {
        console.log(`Found ${taskTimes.length} tasks with timestamps`);
        
        hoursSpent = taskTimes.reduce((total, task) => {
          const start = new Date(task.assigned_at);
          const end = new Date(task.completed_at);
          const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          
          // Apply business rules
          if (diffHours < (1/60)) {
            console.log(`Task skipped - less than 1 minute: ${diffHours.toFixed(3)} hours`);
            return total; // Less than 1 minute
          }
          
          const taskHours = Math.min(diffHours, 2); // Cap at 2 hours
          console.log(`Task hours: ${taskHours.toFixed(2)} (from ${diffHours.toFixed(2)} hours)`);
          return total + taskHours;
        }, 0);
        
        console.log(`Total hours calculated: ${hoursSpent.toFixed(2)}`);
      } else {
        console.log("No task time data found or error occurred:", error);
      }
    }
  } catch (error) {
    console.error("Error calculating hours spent:", error);
  }

  const roundedHours = parseFloat(hoursSpent.toFixed(1));
  console.log(`Final rounded hours: ${roundedHours}`);

  return {
    lifetimePoints,
    tasksCompleted: tasksCompleted || 0,
    hoursSpent: roundedHours,
    daysParticipated: uniqueSessions.size,
    bestStreak: 0,
  };
}

export async function fetchUserRank(userId: string, unitNumber: string) {
  const supabase = await createClient();

  const { data: directory } = await supabase
    .from("anonymous_users")
    .select("registered_user_id")
    .eq("unit_number", unitNumber)
    .not("registered_user_id", "is", null);

  const wardUserIds =
    directory?.map((d) => d.registered_user_id as string).filter(Boolean) || [];

  const { data: pointsRows } = await supabase
    .from("user_points")
    .select("user_id, points")
    .in("user_id", wardUserIds);

  const totals = new Map<string, number>();
  for (const row of pointsRows ?? []) {
    const uid = row.user_id as string;
    const pts = (row as any).points as number;
    totals.set(uid, (totals.get(uid) || 0) + pts);
  }

  const entries = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);

  const rank = entries.findIndex(([uid]) => uid === userId);

  return rank === -1 ? null : rank + 1;
}

export interface CategoryTotal {
  category: string;
  total: number;
}

export async function fetchCategoryBreakdown(
  userId: string
): Promise<CategoryTotal[]> {
  const supabase = await createClient();

  try {
    console.log("Starting fetchCategoryBreakdown for user:", userId);
    return await manualCategoryQuery(userId, supabase);
  } catch (error) {
    console.error("Error in fetchCategoryBreakdown:", error);
    return [];
  }
}

async function manualCategoryQuery(userId: string, supabase: any): Promise<CategoryTotal[]> {
  try {
    // Simplified approach - get completed tasks first
    const { data: tasks, error: tasksError } = await supabase
      .from("cleaning_session_tasks")
      .select("task_id")
      .eq("assigned_to", userId)
      .eq("status", "done");
      
    if (tasksError || !tasks || tasks.length === 0) {
      console.log("No completed tasks found in manual query");
      return [];
    }
    
    const taskIds = tasks.map((t: { task_id: string }) => t.task_id);
    console.log(`Found ${taskIds.length} completed task IDs:`, taskIds);
    
    // Then get the categories for those tasks
    const { data: wardTasks, error: wtError } = await supabase
      .from("ward_tasks")
      .select("id, template_id, title")
      .in("id", taskIds);
      
    if (wtError || !wardTasks || wardTasks.length === 0) {
      console.log("No ward tasks found for the completed tasks");
      return [];
    }
    
    interface WardTask {
      id: string;
      template_id?: string;
      title: string;
    }
    
    const templateIds = wardTasks
      .map((wt: WardTask) => wt.template_id)
      .filter((id?: string) => id != null) as string[];
      
    console.log(`Found ${templateIds.length} template IDs:`, templateIds);
    
    if (templateIds.length === 0) {
      return [{ category: "Uncategorized", total: tasks.length }];
    }
    
    // Finally get the categories from the templates
    const { data: templates, error: tError } = await supabase
      .from("task_templates")
      .select("id, category")
      .in("id", templateIds);
      
    if (tError || !templates || templates.length === 0) {
      console.log("No templates found for the ward tasks");
      return [{ category: "Uncategorized", total: tasks.length }];
    }
    
    interface Template {
      id: string;
      category?: string;
    }
    
    // Create a map of template IDs to categories
    const categoryMap = new Map<string, string>();
    templates.forEach((t: Template) => {
      categoryMap.set(t.id, t.category || "Uncategorized");
    });
    
    // Count tasks by category
    const categoryCounts = new Map<string, number>();
    wardTasks.forEach((wt: WardTask) => {
      const category = wt.template_id ? categoryMap.get(wt.template_id) || "Uncategorized" : "Uncategorized";
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });
    
    const results = Array.from(categoryCounts.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
      
    console.log("Manual category query results:", results);
    return results;
  } catch (error) {
    console.error("Error in manual category query:", error);
    return [];
  }
}
