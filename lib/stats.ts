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

  // Fetch sessions the user participated in to calculate hours spent
  const { data: participantRows } = await supabase
    .from("session_participants")
    .select("session_id")
    .eq("user_id", userId);

  const sessionIds = participantRows?.map((r: any) => r.session_id) || [];
  let totalMinutes = 0;
  if (sessionIds.length > 0) {
    const { data: sessionInfo } = await supabase
      .from("cleaning_sessions")
      .select("duration")
      .in("id", sessionIds)
      .eq("status", "completed");

    totalMinutes =
      sessionInfo?.reduce(
        (sum, row) => sum + ((row as any).duration as number),
        0,
      ) || 0;
  }

  return {
    lifetimePoints,
    tasksCompleted: tasksCompleted || 0,
    hoursSpent: Math.round((totalMinutes / 60) * 10) / 10,
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

export interface HoursByMonth {
  month: string;
  hours: number;
  sessionCount: number;
}

export async function fetchHoursByMonth(userId: string): Promise<HoursByMonth[]> {
  const supabase = await createClient();

  const { data: participantRows } = await supabase
    .from("session_participants")
    .select("session_id")
    .eq("user_id", userId);

  const sessionIds = participantRows?.map((r: any) => r.session_id) || [];
  if (sessionIds.length === 0) {
    return [];
  }

  const { data: sessions } = await supabase
    .from("cleaning_sessions")
    .select("session_date, duration")
    .in("id", sessionIds)
    .eq("status", "completed");

  const monthly: Record<string, { minutes: number; sessions: number }> = {};
  for (const row of sessions || []) {
    const date = new Date((row as any).session_date as string);
    const month = new Date(date.getFullYear(), date.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    if (!monthly[month]) {
      monthly[month] = { minutes: 0, sessions: 0 };
    }
    monthly[month].minutes += (row as any).duration as number;
    monthly[month].sessions += 1;
  }

  return Object.entries(monthly)
    .map(([month, val]) => ({
      month,
      hours: Math.round((val.minutes / 60) * 10) / 10,
      sessionCount: val.sessions,
    }))
    .sort((a, b) => (a.month > b.month ? 1 : -1));
}
