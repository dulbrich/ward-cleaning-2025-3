"use client";

import {
  Button,
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
  TabsTrigger
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
  startOfMonth
} from "date-fns";
import { ArrowLeft, ArrowRight, CalendarIcon, Clock, Copy, List, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

export default function CalendarPage() {
  const [schedules, setSchedules] = useState<CleaningSchedule[]>([]);
  const [wardBranches, setWardBranches] = useState<WardBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<ScheduleDay[]>([]);
  const [wardMembers, setWardMembers] = useState<WardMember[]>([]);
  const [activeView, setActiveView] = useState<"calendar" | "list" | "text">("calendar");
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const { data: branchData, error: branchError } = await supabase
          .from("ward_branches")
          .select("*")
          .order("is_primary", { ascending: false });

        if (branchError) throw branchError;

        if (branchData && branchData.length > 0) {
          setWardBranches(branchData);
          const primaryWard = branchData.find((w) => w.is_primary);
          setSelectedBranch(primaryWard?.id || branchData[0].id);
        }

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

  useEffect(() => {
    if (selectedBranch) {
      fetchSchedules();
    }
  }, [selectedBranch, currentDate]);

  useEffect(() => {
    if (!loading) {
      updateCalendarDays();
    }
  }, [currentDate, schedules, loading]);

  const fetchSchedules = async () => {
    if (!selectedBranch) return;

    try {
      const start = format(startOfMonth(addMonths(currentDate, -6)), "yyyy-MM-dd");
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

  const updateCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = new Date(monthStart);
    const endDate = new Date(monthEnd);

    startDate.setDate(startDate.getDate() - startDate.getDay());
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days: ScheduleDay[] = eachDayOfInterval({ start: startDate, end: endDate }).map((date) => {
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

  const loadWardMembers = () => {
    try {
      const wardContactDataStr = localStorage.getItem("wardContactData");
      if (!wardContactDataStr) {
        console.log("No ward contact data found");
        return;
      }

      const wardData = JSON.parse(wardContactDataStr);
      const extractedMembers: WardMember[] = [];

      if (Array.isArray(wardData)) {
        wardData.forEach((household: any) => {
          if (household.members && Array.isArray(household.members)) {
            household.members.forEach((member: any) => {
              const fullName = member.displayName || member.name || "";
              const nameParts = fullName.split(" ");
              const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
              const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : fullName;

              let group = "";
              const firstLetter = lastName.charAt(0).toUpperCase();
              if (firstLetter >= "A" && firstLetter <= "F") group = "A";
              else if (firstLetter >= "G" && firstLetter <= "L") group = "B";
              else if (firstLetter >= "M" && firstLetter <= "R") group = "C";
              else if (firstLetter >= "S" && firstLetter <= "Z") group = "D";

              let phoneNumber = "";
              if (member.phone) {
                if (typeof member.phone === "object") {
                  phoneNumber = member.phone.number || member.phone.e164 || "";
                } else if (typeof member.phone === "string") {
                  phoneNumber = member.phone;
                }
              }

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

      extractedMembers.sort((a, b) => a.lastName.localeCompare(b.lastName));
      setWardMembers(extractedMembers);
    } catch (error) {
      console.error("Error loading ward members:", error);
    }
  };

  const getGroupMembers = (group: string) => {
    if (group === "All") {
      return wardMembers;
    }
    return wardMembers.filter((member) => member.group === group);
  };

  const handlePrevMonth = () => {
    setCurrentDate((prevDate) => addMonths(prevDate, -1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prevDate) => addMonths(prevDate, 1));
  };

  const handleCopyToClipboard = () => {
    const scheduleText = generateTextSchedule();
    navigator.clipboard
      .writeText(scheduleText)
      .then(() => toast.success("Schedule copied to clipboard"))
      .catch(() => toast.error("Failed to copy schedule"));
  };

  const generateTextSchedule = () => {
    if (!schedules.length) return "No cleaning schedules available.";

    const selectedBranchName = wardBranches.find((branch) => branch.id === selectedBranch)?.name || "Ward";

    let text = `${selectedBranchName} Building Cleaning Schedule\n\n`;

    const months = Array.from(new Set(schedules.map((s) => format(parseISO(s.cleaning_date), "MMMM yyyy"))));

    months.forEach((month) => {
      text += `${month}\n`;
      text += "-------------------\n";

      const monthSchedules = schedules
        .filter((s) => format(parseISO(s.cleaning_date), "MMMM yyyy") === month)
        .sort((a, b) => parseISO(a.cleaning_date).getTime() - parseISO(b.cleaning_date).getTime());

      monthSchedules.forEach((schedule) => {
        const date = format(parseISO(schedule.cleaning_date), "EEEE, MMMM d");
        const time = format(parse(schedule.cleaning_time, "HH:mm:ss", new Date()), "h:mm a");
        text += `${date} at ${time} - ${schedule.assigned_group === "All" ? "Entire Ward" : `Group ${schedule.assigned_group}`}\n`;
      });

      text += "\n";
    });

    text += "Group Assignments:\n";
    text += "-------------------\n";
    text += "Group A: Last names A-F\n";
    text += "Group B: Last names G-L\n";
    text += "Group C: Last names M-R\n";
    text += "Group D: Last names S-Z\n";

    return text;
  };

  const renderCalendarView = () => {
    return (
      <>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} aria-label="Previous Month">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-medium">{format(currentDate, "MMMM yyyy")}</h2>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} aria-label="Next Month">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>

        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="grid grid-cols-7 border-b bg-muted text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="py-2 font-medium text-sm">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 grid-rows-[auto-fill] auto-rows-fr">
            {calendarDays.map((day, i) => (
              <div
                key={i}
                className={cn(
                  "border-r border-b p-1 min-h-[120px]",
                  !day.inMonth && "bg-muted/30 text-muted-foreground",
                  day.date.getDay() === 6 && day.events.length > 0 && "bg-blue-50 dark:bg-blue-950/20"
                )}
              >
                <div className="text-right p-1">{format(day.date, 'd')}</div>
                {day.events.map((event, j) => {
                  const colorMap: Record<string, string> = {
                    A: "bg-blue-100 text-blue-800",
                    B: "bg-green-100 text-green-800",
                    C: "bg-amber-100 text-amber-800",
                    D: "bg-purple-100 text-purple-800",
                    All: "bg-red-100 text-red-800",
                  };
                  const colorClass = colorMap[event.assigned_group] || "bg-gray-100 text-gray-800";
                  return (
                    <div key={j} className={`mt-1 ${colorClass} text-xs p-1 rounded`}>
                      <span>
                        {event.assigned_group === 'All' ? 'Entire Ward' : `Group ${event.assigned_group}`} (
                        {format(parse(event.cleaning_time, 'HH:mm:ss', new Date()), 'h:mm a')})
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

  const renderListView = () => {
    if (!schedules.length) {
      return (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No cleaning schedules available.</p>
        </div>
      );
    }

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
                .sort((a, b) => parseISO(a.cleaning_date).getTime() - parseISO(b.cleaning_date).getTime())
                .map((schedule) => {
                  const date = parseISO(schedule.cleaning_date);
                  const groupMembers = getGroupMembers(schedule.assigned_group);
                  return (
                    <div key={schedule.id} className="bg-card border rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                        <div>
                          <h4 className="font-medium text-sm sm:text-base">
                            {format(date, 'EEEE, MMMM d, yyyy')}
                          </h4>
                          <p className="text-xs sm:text-sm text-muted-foreground flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {format(parse(schedule.cleaning_time, 'HH:mm:ss', new Date()), 'h:mm a')}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <div
                            className={cn(
                              'px-2 py-1 rounded text-xs',
                              schedule.assigned_group === 'A' && 'bg-blue-100 text-blue-800',
                              schedule.assigned_group === 'B' && 'bg-green-100 text-green-800',
                              schedule.assigned_group === 'C' && 'bg-amber-100 text-amber-800',
                              schedule.assigned_group === 'D' && 'bg-purple-100 text-purple-800',
                              schedule.assigned_group === 'All' && 'bg-red-100 text-red-800'
                            )}
                          >
                            {schedule.assigned_group === 'All' ? 'Entire Ward' : `Group ${schedule.assigned_group}`}
                          </div>
                          <span className="text-xs text-muted-foreground">{groupMembers.length} members</span>
                        </div>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="text-xs w-full sm:w-auto">
                              View Participants
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[280px] sm:w-80 max-h-96 overflow-y-auto">
                            <h5 className="font-medium mb-2">Participants</h5>
                            {groupMembers.length > 0 ? (
                              <ul className="space-y-2 text-sm">
                                {groupMembers.map((member, idx) => (
                                  <li key={idx} className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                    <span className="font-medium">{member.name}</span>
                                    <span className="text-muted-foreground text-xs sm:text-sm">{member.phone}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-muted-foreground text-sm">No participants found</p>
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

  const renderTextView = () => {
    const scheduleText = generateTextSchedule();
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="text-lg font-medium">Text Format for Sharing</h3>
          <Button variant="outline" size="sm" onClick={handleCopyToClipboard} className="w-full sm:w-auto">
            <Copy className="w-4 h-4 mr-2" />
            Copy to Clipboard
          </Button>
        </div>
        <div className="bg-card border rounded-lg p-3 sm:p-4 overflow-x-auto">
          <pre className="whitespace-pre-wrap text-xs sm:text-sm break-words">{scheduleText}</pre>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-3xl font-bold">Cleaning Schedule</h1>
        <Tabs
          value={activeView}
          onValueChange={(view) => setActiveView(view as any)}
          className="border rounded-md overflow-hidden"
        >
          <TabsList className="bg-transparent">
            <TabsTrigger value="calendar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <List className="h-4 w-4 mr-2" />
              List
            </TabsTrigger>
            <TabsTrigger value="text" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Mail className="h-4 w-4 mr-2" />
              Text
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[400px]">
          <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <>
          {wardBranches.length > 1 && (
            <div className="mb-4">
              <Select value={selectedBranch || ''} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Select a ward/branch" />
                </SelectTrigger>
                <SelectContent>
                  {wardBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} {branch.is_primary && '(Primary)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-6">
            {activeView === 'calendar' && renderCalendarView()}
            {activeView === 'list' && renderListView()}
            {activeView === 'text' && renderTextView()}
          </div>
        </>
      )}
    </div>
  );
}
