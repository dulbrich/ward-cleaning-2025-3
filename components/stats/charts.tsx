"use client";

import { useEffect, useState } from "react";
import type { MonthlyHours } from "@/lib/stats";
import sampleHours from "@/sample-data/hours_chart_sample_data.json";

export function TasksChart() {
  return (
    <div className="h-48 flex items-center justify-center rounded-md border bg-muted/50 text-muted-foreground">
      Tasks Chart
    </div>
  );
}

export function HoursChart() {
  const [data, setData] = useState<MonthlyHours[] | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setData(sampleHours as MonthlyHours[]), 300);
    return () => clearTimeout(t);
  }, []);

  if (!data) {
    return (
      <div className="h-48 flex items-center justify-center rounded-md border bg-muted/50 text-muted-foreground">
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

  const max = Math.max(...data.map((d) => d.hours));
  const total = data.reduce((sum, d) => sum + d.hours, 0).toFixed(1);

  return (
    <div className="relative h-48 p-2 flex items-end gap-1 rounded-md border">
      <span className="sr-only">Total {total} hours cleaned in the last year</span>
      {data.map((d) => {
        const date = new Date(d.month + "-01T00:00:00");
        const label = date.toLocaleDateString("en-US", { month: "short" });
        const height = `${(d.hours / max) * 100}%`;
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center group text-xs">
            <div
              className="w-full bg-primary rounded-t-md"
              style={{ height }}
              title={`${label} ${date.getFullYear()}: ${d.hours} hours across ${d.sessionCount} sessions`}
            />
            <span className="mt-1">{label}</span>
          </div>
        );
      })}
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
