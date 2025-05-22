"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";

interface CategoryTotal {
  category: string;
  total: number;
}

interface HoursData {
  date: string;
  hours: number;
  tasks: number;
}

export function TasksChart() {
  return (
    <div className="h-48 flex items-center justify-center rounded-md border bg-muted/50 text-muted-foreground">
      Tasks Chart
    </div>
  );
}

export function HoursChart() {
  const [data, setData] = useState<HoursData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year" | "all">("all");

  // Ensure we display data even with very small values
  // A helper that summarizes data for debugging
  const logDataSummary = (data: HoursData[] | null) => {
    if (!data || data.length === 0) {
      console.log("HoursChart: No data");
      return;
    }
    
    const totalHours = data.reduce((sum, d) => sum + d.hours, 0);
    const daysWithHours = data.filter(d => d.hours > 0).length;
    console.log(`HoursChart: ${data.length} days, ${daysWithHours} with activity, total ${totalHours.toFixed(2)} hours`);
    
    // Log days with hours
    data.filter(d => d.hours > 0).forEach(d => {
      console.log(`  ${d.date}: ${d.hours} hours, ${d.tasks} tasks`);
    });
  };

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/stats/hours?range=${timeRange}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API error with status ${res.status}`);
        }
        return res.json();
      })
      .then((d) => {
        const formattedData = Array.isArray(d) ? d : [];
        setData(formattedData);
        logDataSummary(formattedData);
        setError(null);
      })
      .catch((err) => {
        console.error("Error fetching hours data:", err);
        setError(err.message);
        setData([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [timeRange]);

  const formatYTick = (value: number) => {
    return value.toFixed(1);
  };

  const formatXTick = (value: string) => {
    const date = new Date(value);
    return date.getDate().toString();
  };

  const formatTooltipDate = (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate total hours to determine if there's any data for the current time range
  const totalHours = data ? data.reduce((sum, item) => sum + item.hours, 0) : 0;
  const hasData = data !== null && totalHours > 0;

  // Calculate the max value for y-axis with a little padding
  const maxHours = data && data.length > 0
    ? Math.max(Math.max(...data.map((d) => d.hours)) * 1.2, 0.6) // Ensure a minimum scale for small values
    : 0.6;

  // Custom tooltip component with improved decimal display
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as HoursData;
      return (
        <div className="bg-popover p-2 rounded-md shadow-md border text-sm">
          <p className="font-medium">{formatTooltipDate(data.date)}</p>
          <p className="text-primary">
            <span className="font-medium">
              {/* Show more decimal places for small values */}
              {data.hours < 0.1 
                ? data.hours.toFixed(2) 
                : data.hours.toFixed(1)}
            </span> hours
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium">{data.tasks}</span> task{data.tasks !== 1 ? "s" : ""}
          </p>
        </div>
      );
    }
    return null;
  };

  // Time range selector buttons that are always shown
  const TimeRangeSelector = () => (
    <div className="flex text-xs space-x-2">
      <button
        onClick={() => setTimeRange("week")}
        className={`px-2 py-0.5 rounded ${
          timeRange === "week"
            ? "bg-primary text-primary-foreground"
            : "bg-muted hover:bg-muted/80"
        }`}
      >
        Week
      </button>
      <button
        onClick={() => setTimeRange("month")}
        className={`px-2 py-0.5 rounded ${
          timeRange === "month"
            ? "bg-primary text-primary-foreground"
            : "bg-muted hover:bg-muted/80"
        }`}
      >
        Month
      </button>
      <button
        onClick={() => setTimeRange("year")}
        className={`px-2 py-0.5 rounded ${
          timeRange === "year"
            ? "bg-primary text-primary-foreground"
            : "bg-muted hover:bg-muted/80"
        }`}
      >
        Year
      </button>
      <button
        onClick={() => setTimeRange("all")}
        className={`px-2 py-0.5 rounded ${
          timeRange === "all"
            ? "bg-primary text-primary-foreground"
            : "bg-muted hover:bg-muted/80"
        }`}
      >
        All
      </button>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-48 rounded-md border p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Hours Spent Cleaning</h3>
          <TimeRangeSelector />
        </div>
        <div className="flex-grow h-full rounded-md bg-muted/50 animate-pulse" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col h-48 rounded-md border p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Hours Spent Cleaning</h3>
          <TimeRangeSelector />
        </div>
        <div className="flex-grow flex items-center justify-center text-muted-foreground">
          Error loading chart
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-48 rounded-md border p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Hours Spent Cleaning</h3>
        <TimeRangeSelector />
      </div>
      <div className="flex-1 w-full">
        {!hasData ? (
          // Empty state - but we still show the time range buttons
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p>{`No cleaning hours recorded ${timeRange !== "all" ? `in this ${timeRange}` : "yet"}.`}</p>
              <p className="text-xs mt-1">
                {timeRange !== "all" 
                  ? "Try a different time range or complete more tasks" 
                  : "Complete tasks to track your time!"}
              </p>
            </div>
          </div>
        ) : (
          // Data visualization
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.7}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={formatXTick}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval={"preserveStartEnd"}
              />
              <YAxis
                tickFormatter={formatYTick}
                domain={[0, maxHours]}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={25}
                // Ensure we show more ticks for small values
                ticks={[0, maxHours/4, maxHours/2, (maxHours*3)/4, maxHours]}
              />
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke="hsl(var(--muted-foreground) / 0.2)" 
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="hours"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#hoursGradient)"
                strokeWidth={2}
                animationDuration={800}
                isAnimationActive={true}
                // Make small values more visible by setting a minimum dot size
                dot={({ cx, cy, index, payload }) => (
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={2} 
                    fill="hsl(var(--primary))"
                    key={`dot-${index}`}
                  />
                )}
                activeDot={({ cx, cy, index, payload }) => (
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={4} 
                    stroke="hsl(var(--background))" 
                    strokeWidth={2} 
                    fill="hsl(var(--primary))"
                    key={`active-dot-${index}`}
                  />
                )}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
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
