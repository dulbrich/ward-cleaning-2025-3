"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

interface CleaningSchedule {
  id: string;
  ward_branch_id: string;
  cleaning_date: string;
  cleaning_time: string;
  assigned_group: string;
}

interface UpcomingCleaningEventsProps {
  lastName?: string;
}

function getUserGroup(lastName?: string): string | null {
  if (!lastName) return null;
  const letter = lastName.charAt(0).toUpperCase();
  if (letter >= "A" && letter <= "F") return "A";
  if (letter >= "G" && letter <= "L") return "B";
  if (letter >= "M" && letter <= "R") return "C";
  if (letter >= "S" && letter <= "Z") return "D";
  return null;
}

export default function UpcomingCleaningEvents({ lastName }: UpcomingCleaningEventsProps) {
  const [events, setEvents] = useState<CleaningSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("cleaning_schedules")
        .select("*")
        .gte("cleaning_date", today)
        .order("cleaning_date");
      if (!error && data) {
        const group = getUserGroup(lastName);
        const filtered = data.filter((event: CleaningSchedule) => {
          if (event.assigned_group === "All") return true;
          if (!group) return true;
          return event.assigned_group === group;
        });
        setEvents(filtered.slice(0, 3));
      }
      setLoading(false);
    };

    fetchEvents();
  }, [lastName]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(":");
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/30 dark:to-primary/10 border border-primary/30">
      <CardHeader className="flex flex-row items-center gap-2">
        <CalendarDays className="text-primary" />
        <div>
          <CardTitle className="text-base">Upcoming Cleaning</CardTitle>
          <CardDescription>Your next assignments</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : events.length > 0 ? (
          <ul className="space-y-2">
            {events.map(ev => (
              <li
                key={ev.id}
                className="flex justify-between items-center rounded-md bg-muted/50 dark:bg-muted/40 p-2"
              >
                <span>{formatDate(ev.cleaning_date)} {ev.cleaning_time && <>@ {formatTime(ev.cleaning_time)}</>}</span>
                <span className="font-medium text-primary">
                  {ev.assigned_group === "All" ? "All" : `Group ${ev.assigned_group}`}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming cleaning events.</p>
        )}
      </CardContent>
      {events.length > 0 && (
        <CardFooter>
          <Link href="/app/calendar" className="text-sm text-primary hover:underline">
            View full calendar
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}

