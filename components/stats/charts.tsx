"use client";

import { useEffect, useState } from "react";

interface MonthlyHours {
  month: string;
  hours: number;
  sessionCount: number;
}

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
    fetch("/hours_chart_sample_data.json")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => setData([]));
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

  const formatMonth = (dateStr: string) =>
    new Date(dateStr).toLocaleString("default", { month: "short" });

  return (
    <div
      aria-label="Cleaning hours by month"
      className="relative flex h-48 items-end justify-between gap-1 rounded-md border p-2"
    >
      {data.map((d) => (
        <div key={d.month} className="group relative flex-1">
          <div
            className="mx-1 rounded-t bg-primary transition-all group-hover:bg-primary/80"
            style={{ height: `${(d.hours / max) * 100}%` }}
          />
          <div className="mt-1 text-center text-xs text-muted-foreground">
            {formatMonth(d.month)}
          </div>
          <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded border bg-background px-2 py-1 text-xs shadow group-hover:block">
            {`${new Date(d.month).toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}: ${d.hours}h across ${d.sessionCount} sessions`}
          </div>
        </div>
      ))}
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
