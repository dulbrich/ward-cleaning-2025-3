"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { startOfWeek, format } from "date-fns";

interface TasksChartProps {
  userId: string;
}

interface Point {
  week: string;
  count: number;
}

function buildPath(points: { x: number; y: number }[], height: number) {
  if (points.length === 0) return "";
  let d = `M${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    d += ` L${p.x} ${p.y}`;
  }
  return d;
}

export function TasksChart({ userId }: TasksChartProps) {
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const load = async () => {
      const { data: rows } = await supabase
        .from("cleaning_session_tasks")
        .select("completed_at")
        .eq("assigned_to", userId)
        .eq("status", "done")
        .order("completed_at", { ascending: true });

      const counts = new Map<string, number>();
      rows?.forEach((r: any) => {
        if (!r.completed_at) return;
        const week = format(
          startOfWeek(new Date(r.completed_at), { weekStartsOn: 1 }),
          "yyyy-MM-dd"
        );
        counts.set(week, (counts.get(week) || 0) + 1);
      });

      const points = Array.from(counts.entries()).map(([week, count]) => ({
        week,
        count,
      }));
      setData(points);
      setLoading(false);
    };

    load();
  }, [userId]);

  const display = data.length
    ? data
    : [
        { week: "2025-03-03", count: 2 },
        { week: "2025-03-10", count: 1 },
        { week: "2025-03-17", count: 3 },
        { week: "2025-03-24", count: 2 },
        { week: "2025-03-31", count: 4 },
        { week: "2025-04-07", count: 2 },
      ];

  const width = 280;
  const height = 150;
  const maxY = Math.max(...display.map((d) => d.count), 1);
  const stepX = display.length > 1 ? width / (display.length - 1) : width;

  const linePoints = display.map((p, i) => ({
    x: i * stepX,
    y: height - (p.count / maxY) * height,
  }));

  const linePath = buildPath(linePoints, height);
  const areaPath = `${linePath} L${width} ${height} L0 ${height} Z`;

  return (
    <div className="h-48 rounded-md border bg-muted/50 p-2 text-muted-foreground flex items-center justify-center">
      {loading && <span>Loading...</span>}
      {!loading && (
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="taskGradient" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d={areaPath}
            fill="url(#taskGradient)"
            opacity="0.2"
          />
          <path
            d={linePath}
            fill="none"
            stroke="url(#taskGradient)"
            strokeWidth="3"
            filter="url(#glow)"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            <animate
              attributeName="stroke-dashoffset"
              from={linePoints.length * 10}
              to="0"
              dur="0.6s"
              fill="freeze"
            />
          </path>
        </svg>
      )}
    </div>
  );
}

export function HoursChart() {
  return (
    <div className="h-48 flex items-center justify-center rounded-md border bg-muted/50 text-muted-foreground">
      Hours Chart
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
