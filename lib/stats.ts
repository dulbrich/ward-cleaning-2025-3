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

  return {
    lifetimePoints,
    tasksCompleted: tasksCompleted || 0,
    hoursSpent: 0,
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

export interface CategoryBreakdownItem {
  category: string;
  total: number;
}

export async function fetchCategoryBreakdown(
  userId: string,
): Promise<CategoryBreakdownItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cleaning_session_tasks")
    .select("task:ward_tasks(category)")
    .eq("assigned_to", userId)
    .eq("status", "done");

  if (error || !data) {
    console.error("Error fetching category breakdown", error);
    return [];
  }

  const counts: Record<string, number> = {};

  for (const row of data as any[]) {
    let category: string | undefined;
    const task = (row as any).task;

    if (task) {
      if (Array.isArray(task)) {
        category = task[0]?.category as string | undefined;
      } else {
        category = task.category as string | undefined;
      }
    }

    category = category || "Uncategorized";
    counts[category] = (counts[category] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}
