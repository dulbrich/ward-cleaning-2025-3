"use client";

import { useEffect, useState } from "react";

interface CategoryData {
  category: string;
  total: number;
}

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
  const [data, setData] = useState<CategoryData[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats/category")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center rounded-md border bg-muted/50 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center rounded-md border bg-muted/50 text-muted-foreground">
        No data
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.total, 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const slices = data.map((d, idx) => {
    const length = (d.total / total) * circumference;
    const style = {
      strokeDasharray: `${length} ${circumference - length}`,
      strokeDashoffset: offset,
      stroke: `hsl(var(--chart-${(idx % 5) + 1}))`,
    } as React.CSSProperties;
    offset -= length;
    return (
      <circle
        key={d.category}
        r={radius}
        cx="100"
        cy="100"
        fill="transparent"
        strokeWidth="40"
        style={style}
      />
    );
  });

  return (
    <div className="p-4 border rounded-md flex flex-col items-center">
      <svg width="200" height="200" viewBox="0 0 200 200" className="mb-4">
        <g transform="rotate(-90 100 100)">{slices}</g>
        <circle cx="100" cy="100" r="50" fill="var(--background)" />
        <text x="100" y="105" textAnchor="middle" className="font-bold text-xl">
          {total}
        </text>
      </svg>
      <ul className="text-sm space-y-1">
        {data.map((d, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full block"
              style={{ backgroundColor: `hsl(var(--chart-${(idx % 5) + 1}))` }}
            ></span>
            <span className="truncate">
              {d.category} ({d.total})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
