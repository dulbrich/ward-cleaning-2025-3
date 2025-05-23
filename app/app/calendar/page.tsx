"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  parse,
  parseISO,
  startOfMonth,
} from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  Clock,
  Copy,
  List,
  Mail,
  MoreHorizontal,
  Trash2,
  ChevronsUpDown,
  Edit,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// Types
interface WardBranch {
  id: string;
  name: string;
  unit_type: "Ward" | "Branch";
  unit_number?: string;
  is_primary: boolean;
}

interface CleaningSchedule {
  id: string;
  ward_branch_id: string;
  cleaning_date: string;
  cleaning_time: string;
  assigned_group: string;
  created_at: string;
  updated_at: string;
}

interface ScheduleDay {
  date: Date;
  inMonth: boolean;
  events: CleaningSchedule[];
}

interface WardMember {
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  userHash?: string;
  group: string;
}

// Add these helper functions for time handling
const formatTimeDisplay = (
  hours: number,
  minutes: number,
  period: "AM" | "PM",
) => {
  const formattedHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const formattedMinutes = minutes.toString().padStart(2, "0");
  return `${formattedHours}:${formattedMinutes} ${period}`;
};

// Prototype widget for adjusting ward assignments
const WardAssignmentsWidget = () => {
  const [counts, setCounts] = useState<number[]>([18, 26, 24, 32]);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<{
    index: number;
    startY: number;
    startCounts: number[];
  } | null>(null);

  const total = useMemo(() => counts.reduce((a, b) => a + b, 0), [counts]);

  const startDrag = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    dragInfo.current = { index, startY: e.clientY, startCounts: [...counts] };

    const onMove = (evt: MouseEvent) => {
      if (!dragInfo.current || !containerRef.current) return;

      const { startY, index, startCounts } = dragInfo.current;
      const deltaY = evt.clientY - startY;
      const height = containerRef.current.getBoundingClientRect().height;
      const deltaCount = Math.round((deltaY / height) * total);

      let a = startCounts[index] + deltaCount;
      let b = startCounts[index + 1] - deltaCount;

      if (a < 0) {
        b += a;
        a = 0;
      }
      if (b < 0) {
        a += b;
        b = 0;
      }

      const newCounts = [...startCounts];
      newCounts[index] = a;
      newCounts[index + 1] = b;
      setCounts(newCounts);
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      dragInfo.current = null;
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  return (
    <div
      className="bg-card rounded-lg border overflow-hidden"
      ref={containerRef}
    >
      <div className="relative flex flex-col h-[720px] divide-y">
        {counts.map((count, idx) => (
          <div
            key={idx}
            style={{ flex: count }}
            className="relative flex items-center justify-center"
          >
            <span className="absolute top-1 left-1 text-sm font-medium">
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="text-2xl font-bold">{count}</span>
            {idx < counts.length - 1 && (
              <button
                onMouseDown={(e) => startDrag(idx, e)}
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-background border rounded-full p-1 shadow cursor-row-resize"
              >
                <ChevronsUpDown className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const parseTimeString = (timeString: string) => {
  let hours = 9; // Default to 9
  let minutes = 0;
  let period: "AM" | "PM" = "AM";

  // Parse HH:MM format
  if (timeString.includes(":")) {
    const [hourStr, minuteStr] = timeString.split(":");
    hours = parseInt(hourStr, 10);
    minutes = parseInt(minuteStr, 10) || 0;
  }

  // If hours > 12, adjust for PM
  if (hours >= 12) {
    period = "PM";
    if (hours > 12) hours -= 12;
  }

  return { hours, minutes, period };
};

// Add a TimeSelector component to your component
const TimeSelector = ({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) => {
  // Use useMemo to parse time string only when value changes
  const parsedTime = useMemo(() => parseTimeString(value), [value]);

  // Initialize state with parsed values
  const [hours, setHours] = useState(parsedTime.hours);
  const [minutes, setMinutes] = useState(parsedTime.minutes);
  const [period, setPeriod] = useState<"AM" | "PM">(parsedTime.period);

  // Update local state when props change, but only if significantly different
  useEffect(() => {
    const newParsed = parseTimeString(value);
    if (
      Math.abs(newParsed.hours - hours) > 1 ||
      Math.abs(newParsed.minutes - minutes) > 5 ||
      newParsed.period !== period
    ) {
      setHours(newParsed.hours);
      setMinutes(newParsed.minutes);
      setPeriod(newParsed.period);
    }
  }, [value]);

  // Generate options for hours and minutes
  const hourOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i)).map((h) => ({
        value: h,
        label: h.toString(),
      })),
    [],
  );

  const minuteOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => i * 5).map((m) => ({
        value: m,
        label: m.toString().padStart(2, "0"),
      })),
    [],
  );

  // Handle changes with useCallback to avoid recreating functions
  const handleHourChange = useCallback((v: string) => {
    setHours(parseInt(v, 10));
  }, []);

  const handleMinuteChange = useCallback((v: string) => {
    setMinutes(parseInt(v, 10));
  }, []);

  const handlePeriodChange = useCallback((v: string) => {
    setPeriod(v as "AM" | "PM");
  }, []);

  // Update parent when values change
  useEffect(() => {
    let adjustedHours = hours;
    if (period === "PM" && hours < 12) adjustedHours += 12;
    if (period === "AM" && hours === 12) adjustedHours = 0;

    const timeString = `${adjustedHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    // Only call onChange if the new value is different from current prop
    // to avoid potential loops
    if (timeString !== value) {
      onChange(timeString);
    }
  }, [hours, minutes, period, onChange, value]);

  return (
    <div
      className={cn(
        "flex items-center rounded-md border p-3 relative",
        className,
      )}
    >
      <Clock className="h-4 w-4 mr-3 text-muted-foreground" />

      <div className="flex items-center space-x-2">
        <Select value={hours.toString()} onValueChange={handleHourChange}>
          <SelectTrigger className="w-14">
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent>
            {hourOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span>:</span>

        <Select value={minutes.toString()} onValueChange={handleMinuteChange}>
          <SelectTrigger className="w-16">
            <SelectValue placeholder="Min" />
          </SelectTrigger>
          <SelectContent>
            {minuteOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-16">
            <SelectValue placeholder="AM/PM" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default function SchedulePage() {
  // State variables
  const [schedules, setSchedules] = useState<CleaningSchedule[]>([]);
  const [wardBranches, setWardBranches] = useState<WardBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<ScheduleDay[]>([]);
  const [wardMembers, setWardMembers] = useState<WardMember[]>([]);
  const [activeView, setActiveView] = useState<
    "calendar" | "list" | "text" | "edit"
  >("calendar");

  // Dialog states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] =
    useState<CleaningSchedule | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] =
    useState<CleaningSchedule | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const supabase = createClient();

  // Initialize data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch ward branches
        const { data: branchData, error: branchError } = await supabase
          .from("ward_branches")
          .select("*")
          .order("is_primary", { ascending: false });

        if (branchError) throw branchError;

        if (branchData && branchData.length > 0) {
          setWardBranches(branchData);
          // Select primary ward by default
          const primaryWard = branchData.find((ward) => ward.is_primary);
          setSelectedBranch(primaryWard?.id || branchData[0].id);
        }

        // Load ward contact data
        loadWardMembers();
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Load schedules when ward branch changes OR current date changes
  useEffect(() => {
    if (selectedBranch) {
      fetchSchedules();
    }
  }, [selectedBranch, currentDate]);

  // Update calendar days when current date or schedules change
  useEffect(() => {
    if (!loading) {
      updateCalendarDays();
    }
  }, [currentDate, schedules, loading]);

  // Fetch cleaning schedules for selected branch
  const fetchSchedules = async () => {
    if (!selectedBranch) return;

    try {
      // Fetch schedules from 6 months before to 6 months after the current date
      // to ensure we have all schedules when navigating months
      const start = format(
        startOfMonth(addMonths(currentDate, -6)),
        "yyyy-MM-dd",
      );
      const end = format(endOfMonth(addMonths(currentDate, 6)), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("cleaning_schedules")
        .select("*")
        .eq("ward_branch_id", selectedBranch)
        .gte("cleaning_date", start)
        .lte("cleaning_date", end)
        .order("cleaning_date");

      if (error) throw error;

      setSchedules(data || []);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast.error("Failed to load schedules");
    }
  };

  // Update calendar days
  const updateCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = new Date(monthStart);
    const endDate = new Date(monthEnd);

    // Adjust start date to beginning of the week (Sunday)
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // Adjust end date to end of the week (Saturday)
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days: ScheduleDay[] = eachDayOfInterval({
      start: startDate,
      end: endDate,
    }).map((date) => {
      // Find events for this day
      const dayEvents = schedules.filter((schedule) => {
        const scheduleDate = parseISO(schedule.cleaning_date);
        return (
          scheduleDate.getDate() === date.getDate() &&
          scheduleDate.getMonth() === date.getMonth() &&
          scheduleDate.getFullYear() === date.getFullYear()
        );
      });

      return {
        date,
        inMonth: isSameMonth(date, currentDate),
        events: dayEvents,
      };
    });

    setCalendarDays(days);
  };

  // Load ward members from localStorage
  const loadWardMembers = () => {
    try {
      const wardContactDataStr = localStorage.getItem("wardContactData");
      if (!wardContactDataStr) {
        console.log("No ward contact data found");
        return;
      }

      const wardData = JSON.parse(wardContactDataStr);
      const extractedMembers: WardMember[] = [];

      // Process the ward data structure
      if (Array.isArray(wardData)) {
        wardData.forEach((household: any) => {
          if (household.members && Array.isArray(household.members)) {
            household.members.forEach((member: any) => {
              // Extract name parts
              const fullName = member.displayName || member.name || "";
              const nameParts = fullName.split(" ");
              const lastName =
                nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
              const firstName =
                nameParts.length > 1
                  ? nameParts.slice(0, -1).join(" ")
                  : fullName;

              // Determine group based on last name
              let group = "";
              const firstLetter = lastName.charAt(0).toUpperCase();
              if (firstLetter >= "A" && firstLetter <= "F") group = "A";
              else if (firstLetter >= "G" && firstLetter <= "L") group = "B";
              else if (firstLetter >= "M" && firstLetter <= "R") group = "C";
              else if (firstLetter >= "S" && firstLetter <= "Z") group = "D";

              // Extract phone
              let phoneNumber = "";
              if (member.phone) {
                if (typeof member.phone === "object") {
                  phoneNumber = member.phone.number || member.phone.e164 || "";
                } else if (typeof member.phone === "string") {
                  phoneNumber = member.phone;
                }
              }

              // Extract email
              let email = "";
              if (member.email) {
                if (typeof member.email === "object") {
                  email = member.email.email || "";
                } else if (typeof member.email === "string") {
                  email = member.email;
                }
              }

              extractedMembers.push({
                name: fullName,
                firstName,
                lastName,
                phone: phoneNumber,
                email,
                group,
              });
            });
          }
        });
      }

      // Sort by last name
      extractedMembers.sort((a, b) => a.lastName.localeCompare(b.lastName));
      setWardMembers(extractedMembers);
    } catch (error) {
      console.error("Error loading ward members:", error);
    }
  };

  // Get filtered members for a group
  const getGroupMembers = (group: string) => {
    if (group === "All") {
      return wardMembers;
    }

    return wardMembers.filter((member) => member.group === group);
  };

  // Handle month navigation
  const handlePrevMonth = () => {
    setCurrentDate((prevDate) => addMonths(prevDate, -1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prevDate) => addMonths(prevDate, 1));
  };

  // Handle schedule edit
  const handleSaveSchedule = async () => {
    if (!editingSchedule) return;

    setSavingSchedule(true);

    try {
      // Format time to HH:MM:SS
      const timeFormatted = editingSchedule.cleaning_time.includes(":")
        ? editingSchedule.cleaning_time +
          (editingSchedule.cleaning_time.split(":").length === 2 ? ":00" : "")
        : editingSchedule.cleaning_time + ":00:00";

      const { data, error } = await supabase
        .from("cleaning_schedules")
        .update({
          cleaning_time: timeFormatted,
          assigned_group: editingSchedule.assigned_group,
        })
        .eq("id", editingSchedule.id);

      if (error) throw error;

      toast.success("Schedule updated successfully");
      setShowEditDialog(false);
      setEditingSchedule(null);
      fetchSchedules();
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast.error("Failed to update schedule");
    } finally {
      setSavingSchedule(false);
    }
  };

  // Handle copying text schedule to clipboard
  const handleCopyToClipboard = () => {
    const scheduleText = generateTextSchedule();
    navigator.clipboard
      .writeText(scheduleText)
      .then(() => toast.success("Schedule copied to clipboard"))
      .catch(() => toast.error("Failed to copy schedule"));
  };

  // Generate text schedule for copying
  const generateTextSchedule = () => {
    if (!schedules.length) return "No cleaning schedules available.";

    const selectedBranchName =
      wardBranches.find((branch) => branch.id === selectedBranch)?.name ||
      "Ward";

    let text = `${selectedBranchName} Building Cleaning Schedule\n\n`;

    // Group schedules by month
    const months = Array.from(
      new Set(
        schedules.map((s) => format(parseISO(s.cleaning_date), "MMMM yyyy")),
      ),
    );

    months.forEach((month) => {
      text += `${month}\n`;
      text += "-------------------\n";

      const monthSchedules = schedules
        .filter((s) => format(parseISO(s.cleaning_date), "MMMM yyyy") === month)
        .sort(
          (a, b) =>
            parseISO(a.cleaning_date).getTime() -
            parseISO(b.cleaning_date).getTime(),
        );

      monthSchedules.forEach((schedule) => {
        const date = format(parseISO(schedule.cleaning_date), "EEEE, MMMM d");
        const time = format(
          parse(schedule.cleaning_time, "HH:mm:ss", new Date()),
          "h:mm a",
        );
        text += `${date} at ${time} - ${schedule.assigned_group === "All" ? "Entire Ward" : `Group ${schedule.assigned_group}`}\n`;
      });

      text += "\n";
    });

    // Add group assignments
    text += "Group Assignments:\n";
    text += "-------------------\n";
    text += "Group A: Last names A-F\n";
    text += "Group B: Last names G-L\n";
    text += "Group C: Last names M-R\n";
    text += "Group D: Last names S-Z\n";

    return text;
  };

  // Month selection options for schedule generation
  const getMonthOptions = () => {
    const options = [];
    const currentMonth = new Date();

    for (let i = 0; i < 12; i++) {
      const monthDate = addMonths(currentMonth, i);
      const monthValue = format(monthDate, "yyyy-MM");
      options.push({
        value: monthValue,
        label: format(monthDate, "MMMM yyyy"),
      });
    }

    return options;
  };

  // Render calendar view
  const renderCalendarView = () => {
    return (
      <>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              aria-label="Previous Month"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-medium">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              aria-label="Next Month"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
        </div>

        <div className="bg-card rounded-lg border overflow-hidden">
          {/* Month Header */}
          <div className="grid grid-cols-7 border-b bg-muted text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2 font-medium text-sm">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 grid-rows-[auto-fill] auto-rows-fr">
            {calendarDays.map((day, i) => (
              <div
                key={i}
                className={cn(
                  "border-r border-b p-1 min-h-[120px]",
                  !day.inMonth && "bg-muted/30 text-muted-foreground",
                  day.date.getDay() === 6 &&
                    day.events.length > 0 &&
                    "bg-blue-50 dark:bg-blue-950/20",
                )}
              >
                <div className="text-right p-1">{format(day.date, "d")}</div>

                {day.events.map((event, j) => {
                  // Determine color based on group
                  const colorMap: Record<string, string> = {
                    A: "bg-blue-100 text-blue-800",
                    B: "bg-green-100 text-green-800",
                    C: "bg-amber-100 text-amber-800",
                    D: "bg-purple-100 text-purple-800",
                    All: "bg-red-100 text-red-800",
                  };

                  const colorClass =
                    colorMap[event.assigned_group] ||
                    "bg-gray-100 text-gray-800";

                  return (
                    <div
                      key={j}
                      className={`mt-1 ${colorClass} text-xs p-1 rounded flex justify-between items-center group cursor-pointer`}
                      onClick={() => {
                        setEditingSchedule(event);
                        setShowEditDialog(true);
                      }}
                    >
                      <span>
                        {event.assigned_group === "All"
                          ? "Entire Ward"
                          : `Group ${event.assigned_group}`}{" "}
                        (
                        {format(
                          parse(event.cleaning_time, "HH:mm:ss", new Date()),
                          "h:mm a",
                        )}
                        )
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  // Render list view
  const renderListView = () => {
    if (!schedules.length) {
      return (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">
            No cleaning schedules available. Create a schedule to get started.
          </p>
        </div>
      );
    }

    // Group by month
    const groupedSchedules: Record<string, CleaningSchedule[]> = {};

    schedules.forEach((schedule) => {
      const month = format(parseISO(schedule.cleaning_date), "MMMM yyyy");
      if (!groupedSchedules[month]) {
        groupedSchedules[month] = [];
      }
      groupedSchedules[month].push(schedule);
    });

    return (
      <div className="space-y-6">
        {Object.entries(groupedSchedules).map(([month, monthSchedules]) => (
          <div key={month} className="space-y-2">
            <h3 className="text-lg font-medium">{month}</h3>
            <div className="space-y-2">
              {monthSchedules
                .sort(
                  (a, b) =>
                    parseISO(a.cleaning_date).getTime() -
                    parseISO(b.cleaning_date).getTime(),
                )
                .map((schedule) => {
                  const date = parseISO(schedule.cleaning_date);
                  const groupMembers = getGroupMembers(schedule.assigned_group);

                  return (
                    <div
                      key={schedule.id}
                      className="bg-card border rounded-lg p-3 sm:p-4"
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                        <div>
                          <h4 className="font-medium text-sm sm:text-base">
                            {format(date, "EEEE, MMMM d, yyyy")}
                          </h4>
                          <p className="text-xs sm:text-sm text-muted-foreground flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {format(
                              parse(
                                schedule.cleaning_time,
                                "HH:mm:ss",
                                new Date(),
                              ),
                              "h:mm a",
                            )}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingSchedule(schedule);
                              setShowEditDialog(true);
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <div
                            className={cn(
                              "px-2 py-1 rounded text-xs",
                              schedule.assigned_group === "A" &&
                                "bg-blue-100 text-blue-800",
                              schedule.assigned_group === "B" &&
                                "bg-green-100 text-green-800",
                              schedule.assigned_group === "C" &&
                                "bg-amber-100 text-amber-800",
                              schedule.assigned_group === "D" &&
                                "bg-purple-100 text-purple-800",
                              schedule.assigned_group === "All" &&
                                "bg-red-100 text-red-800",
                            )}
                          >
                            {schedule.assigned_group === "All"
                              ? "Entire Ward"
                              : `Group ${schedule.assigned_group}`}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {groupMembers.length} members
                          </span>
                        </div>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs w-full sm:w-auto"
                            >
                              View Participants
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[280px] sm:w-80 max-h-96 overflow-y-auto">
                            <h5 className="font-medium mb-2">Participants</h5>
                            {groupMembers.length > 0 ? (
                              <ul className="space-y-2 text-sm">
                                {groupMembers.map((member, idx) => (
                                  <li
                                    key={idx}
                                    className="flex flex-col sm:flex-row sm:justify-between gap-1"
                                  >
                                    <span className="font-medium">
                                      {member.name}
                                    </span>
                                    <span className="text-muted-foreground text-xs sm:text-sm">
                                      {member.phone}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-muted-foreground text-sm">
                                No participants found
                              </p>
                            )}
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render text/email view
  const renderTextView = () => {
    const scheduleText = generateTextSchedule();

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="text-lg font-medium">Text Format for Sharing</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyToClipboard}
            className="w-full sm:w-auto"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy to Clipboard
          </Button>
        </div>

        <div className="bg-card border rounded-lg p-3 sm:p-4 overflow-x-auto">
          <pre className="whitespace-pre-wrap text-xs sm:text-sm break-words">
            {scheduleText}
          </pre>
        </div>
      </div>
    );
  };

  // Add delete handlers
  const handleDeleteSchedule = async () => {
    if (!scheduleToDelete) return;

    try {
      const { error } = await supabase
        .from("cleaning_schedules")
        .delete()
        .eq("id", scheduleToDelete.id);

      if (error) throw error;

      toast.success("Schedule deleted successfully");
      setShowDeleteDialog(false);
      setScheduleToDelete(null);
      fetchSchedules();
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast.error("Failed to delete schedule");
    }
  };

  return (
    <div className="space-y-6">
      {/* Make header section more responsive with flex-col on small screens */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-3xl font-bold">Cleaning Schedule</h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Tabs
            value={activeView}
            onValueChange={(view) => setActiveView(view as any)}
            className="border rounded-md overflow-hidden"
          >
            <TabsList className="bg-transparent">
              <TabsTrigger
                value="calendar"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendar
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <List className="h-4 w-4 mr-2" />
                List
              </TabsTrigger>
              <TabsTrigger
                value="text"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Mail className="h-4 w-4 mr-2" />
                Text
              </TabsTrigger>
              <TabsTrigger
                value="edit"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[400px]">
          <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Ward/Branch Selection - Only show if more than one ward */}
          {wardBranches.length > 1 && (
            <div className="mb-4">
              <Select
                value={selectedBranch || ""}
                onValueChange={setSelectedBranch}
              >
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Select a ward/branch" />
                </SelectTrigger>
                <SelectContent>
                  {wardBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} {branch.is_primary && "(Primary)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* View Content */}
          <div className="space-y-6">
            {activeView === "calendar" && renderCalendarView()}
            {activeView === "list" && renderListView()}
            {activeView === "text" && renderTextView()}
            {activeView === "edit" && (
              <div className="flex justify-center">
                <WardAssignmentsWidget />
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit Schedule Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit Cleaning Day</DialogTitle>
          </DialogHeader>

          {editingSchedule && (
            <div className="space-y-4 my-4">
              <div>
                <h3 className="font-medium text-sm sm:text-base break-words">
                  {format(
                    parseISO(editingSchedule.cleaning_date),
                    "EEEE, MMMM d, yyyy",
                  )}
                </h3>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cleaning Time</label>
                <TimeSelector
                  value={editingSchedule.cleaning_time.substring(0, 5)}
                  onChange={(value) =>
                    setEditingSchedule({
                      ...editingSchedule,
                      cleaning_time: value,
                    })
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Assigned Group</label>
                <Select
                  value={editingSchedule.assigned_group}
                  onValueChange={(value) =>
                    setEditingSchedule({
                      ...editingSchedule,
                      assigned_group: value,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Group A (A-F)</SelectItem>
                    <SelectItem value="B">Group B (G-L)</SelectItem>
                    <SelectItem value="C">Group C (M-R)</SelectItem>
                    <SelectItem value="D">Group D (S-Z)</SelectItem>
                    <SelectItem value="All">Entire Ward</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Participants</h4>
                <div className="text-sm border rounded-md p-3 max-h-32 overflow-y-auto">
                  {getGroupMembers(editingSchedule.assigned_group)
                    .slice(0, 8)
                    .map((member, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between py-1 flex-wrap"
                      >
                        <span className="mr-2 break-words">{member.name}</span>
                        <span className="text-muted-foreground text-xs sm:text-sm">
                          {member.phone}
                        </span>
                      </div>
                    ))}
                  {getGroupMembers(editingSchedule.assigned_group).length >
                    8 && (
                    <div className="text-center text-muted-foreground pt-1">
                      +
                      {getGroupMembers(editingSchedule.assigned_group).length -
                        8}{" "}
                      more participants
                    </div>
                  )}
                  {getGroupMembers(editingSchedule.assigned_group).length ===
                    0 && (
                    <div className="text-center text-muted-foreground py-2">
                      No participants found
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex w-full sm:w-auto justify-between sm:justify-start gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setScheduleToDelete(editingSchedule);
                  setShowEditDialog(false);
                  setShowDeleteDialog(true);
                }}
                className="w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="w-auto"
              >
                Cancel
              </Button>
            </div>
            <Button
              onClick={handleSaveSchedule}
              disabled={savingSchedule}
              className="w-full sm:w-auto"
            >
              {savingSchedule ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Schedule Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full">
          <DialogHeader className="space-y-3">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <DialogTitle className="text-center">
              Delete Cleaning Schedule
            </DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete this cleaning schedule? This
              action <span className="font-bold">cannot be undone</span>.
            </DialogDescription>
          </DialogHeader>

          {scheduleToDelete && (
            <div className="my-4 p-4 border rounded-md bg-red-50 dark:bg-red-950 text-center">
              <p className="font-medium">
                {format(
                  parseISO(scheduleToDelete.cleaning_date),
                  "EEEE, MMMM d, yyyy",
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(
                  parse(scheduleToDelete.cleaning_time, "HH:mm:ss", new Date()),
                  "h:mm a",
                )}{" "}
                -
                {scheduleToDelete.assigned_group === "All"
                  ? " Entire Ward"
                  : ` Group ${scheduleToDelete.assigned_group}`}
              </p>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSchedule}
              className="w-full sm:w-auto"
            >
              Delete Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
