"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { HoursByMonth } from "@/lib/stats";

export function TasksChart() {
  return (
    <div className="h-48 flex items-center justify-center rounded-md border bg-muted/50 text-muted-foreground">
      Tasks Chart
    </div>
  );
}

export function HoursChart() {
  const supabase = createClient();
  const [data, setData] = useState<HoursByMonth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: rows } = await supabase
        .from("session_participants")
        .select("session_id")
        .eq("user_id", user.id);

      const sessionIds = rows?.map((r: any) => r.session_id) || [];
      if (sessionIds.length === 0) {
        setLoading(false);
        setData([]);
        return;
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

      const formatted = Object.entries(monthly)
        .map(([month, val]) => ({
          month,
          hours: Math.round((val.minutes / 60) * 10) / 10,
          sessionCount: val.sessions,
        }))
        .sort((a, b) => (a.month > b.month ? 1 : -1))
        .slice(-12);

      setData(formatted);
      setLoading(false);
    };

    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center rounded-md border bg-muted/50 text-muted-foreground animate-pulse">
        Loading...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center rounded-md border bg-muted/50 text-muted-foreground">
        No cleaning hours logged yet
      </div>
    );
  }

  const maxHours = Math.max(...data.map((d) => d.hours));

  const formatMonth = (m: string) => {
    const date = new Date(m);
    return date.toLocaleString("default", { month: "short" });
  };

  return (
    <div className="h-48 flex flex-col justify-end rounded-md border bg-muted/50 px-2 pt-2 relative" aria-label="Cleaning hours chart">
      <div className="flex items-end justify-between h-full">
        {data.map((d) => (
          <div key={d.month} className="flex-1 mx-0.5 flex flex-col items-center">
            <div
              className="w-full bg-primary rounded-t-md transition-all"
              style={{ height: `${(d.hours / maxHours) * 100}%` }}
              title={`${formatMonth(d.month)} ${d.month.slice(0, 4)}: ${d.hours} hours across ${d.sessionCount} sessions`}
            />
          </div>
        ))}
      </div>
      <div className="absolute bottom-1 left-0 right-0 flex justify-between text-[10px] text-muted-foreground px-1 pointer-events-none">
        {data.map((d) => (
          <span key={d.month} className="flex-1 text-center">
            {formatMonth(d.month)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CategoryChart() {
  return (
    <div className="h-48 flex items-center justify-center rounded-md border bg-muted/50 text-muted-foreground">
      Category Chart
    </div>
  );
}
