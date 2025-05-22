"use client";

import { useEffect, useState } from "react";

interface CategoryTotal {
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
  const [data, setData] = useState<CategoryTotal[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/stats/category")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API error with status ${res.status}`);
        }
        return res.json();
      })
      .then((d) => {
        console.log("CategoryChart data received:", d);
        setData(Array.isArray(d) ? d : []);
        setError(null);
      })
      .catch((err) => {
        console.error("Error fetching category data:", err);
        setError(err.message);
        setData([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="h-48 rounded-md border bg-muted/50 animate-pulse" />
    );
  }

  if (error) {
    return (
      <div className="h-48 flex items-center justify-center rounded-md border bg-muted/50 text-muted-foreground">
        Error loading chart
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center rounded-md border bg-muted/50 text-muted-foreground">
        No completed tasks yet
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.total, 0);
  const radius = 26;
  const stroke = 16;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const colors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  const segments = data.map((d, i) => {
    const dash = (d.total / total) * circumference;
    const segment = (
      <circle
        key={i}
        r={radius}
        cx="40"
        cy="40"
        fill="transparent"
        stroke={`hsl(${colors[i % colors.length]})`}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={-offset}
        strokeLinecap="butt"
        transform="rotate(-90 40 40)"
      />
    );
    offset += dash;
    return segment;
  });

  return (
    <div className="flex items-center gap-4 rounded-md border p-4">
      <svg viewBox="0 0 80 80" className="w-28 h-28">
        <circle
          r={radius}
          cx="40"
          cy="40"
          fill="transparent"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        {segments}
      </svg>
      <ul className="text-sm space-y-1">
        {data.map((d, i) => (
          <li key={d.category} className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: `hsl(${colors[i % colors.length]})` }}
            />
            {d.category} - {d.total}
          </li>
        ))}
      </ul>
    </div>
  );
}
