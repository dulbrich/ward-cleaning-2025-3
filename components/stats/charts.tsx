"use client";

import { useEffect, useState } from "react";

export function TasksChart() {
  return (
    <div className="h-48 flex items-center justify-center rounded-md border bg-muted/50 text-muted-foreground">
      Tasks Chart
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
  const data = [
    { label: "Chapel", count: 18 },
    { label: "Restrooms", count: 10 },
    { label: "Classrooms", count: 7 },
    { label: "Kitchen", count: 6 },
    { label: "Other", count: 4 },
  ];

  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  const total = data.reduce((t, d) => t + d.count, 0);
  let cumulative = 0;
  const segments = data
    .map((d, i) => {
      const start = cumulative;
      cumulative += d.count / total;
      const startPct = (start * 100).toFixed(2);
      const endPct = (cumulative * 100).toFixed(2);
      return `${colors[i % colors.length]} ${startPct}% ${endPct}%`;
    })
    .join(", ");

  const gradient = {
    background: `conic-gradient(${segments})`,
  } as React.CSSProperties;

  return (
    <div className="flex items-center justify-center gap-4 h-48 rounded-md border bg-muted/50 p-4">
      <div className="relative h-32 w-32">
        <div className="h-full w-full rounded-full" style={gradient} />
        <div className="absolute inset-4 rounded-full bg-background" />
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
          {total}
        </div>
      </div>
      <ul className="space-y-1 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            {d.label} ({d.count})
          </li>
        ))}
      </ul>
    </div>
  );
}
