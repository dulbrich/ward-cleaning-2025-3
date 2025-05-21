import { createClient } from "@/utils/supabase/server";
import sampleHours from "@/sample-data/hours_chart_sample_data.json";

export interface UserStats {
  lifetimePoints: number;
  tasksCompleted: number;
  hoursSpent: number;
  daysParticipated: number;
  bestStreak: number;
}

export interface MonthlyHours {
  month: string; // YYYY-MM
  hours: number;
  sessionCount: number;
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

  const monthly = await fetchHoursByMonth(userId);
  const hoursSpent = monthly.reduce((sum, m) => sum + m.hours, 0);

  return {
    lifetimePoints,
    tasksCompleted: tasksCompleted || 0,
    hoursSpent: Number(hoursSpent.toFixed(1)),
    daysParticipated: uniqueSessions.size,
    bestStreak: 0,
  };
}

export async function fetchHoursByMonth(
  _userId: string
): Promise<MonthlyHours[]> {
  // Temporary implementation using sample data
  return (sampleHours as MonthlyHours[]).map((row) => ({
    month: row.month,
    hours: row.hours,
    sessionCount: row.sessionCount,
  }));
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
