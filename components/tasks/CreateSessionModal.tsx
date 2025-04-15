"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Define the cleaning schedule type
interface CleaningSchedule {
  id: string;
  ward_branch_id: string;
  cleaning_date: string;
  cleaning_time: string;
  assigned_group: string;
  created_at: string;
  updated_at: string;
}

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wardBranchId: string;
  onSessionCreated: (sessionId: string) => void;
}

export function CreateSessionModal({
  isOpen,
  onClose,
  wardBranchId,
  onSessionCreated,
}: CreateSessionModalProps) {
  const [sessionName, setSessionName] = useState("");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [customDate, setCustomDate] = useState<Date | undefined>(new Date());
  const [schedules, setSchedules] = useState<CleaningSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  // Load cleaning schedules
  useEffect(() => {
    if (isOpen && wardBranchId) {
      loadSchedules();
    }
  }, [isOpen, wardBranchId]);

  const loadSchedules = async () => {
    setIsLoading(true);
    setError("");
    try {
      // Load future schedules only
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(
        `/api/cleaning-schedules?ward_branch_id=${wardBranchId}&start_date=${today}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to load cleaning schedules");
      }

      const data = await res.json();
      // Sort by date (nearest first)
      const sortedSchedules = data.sort(
        (a: CleaningSchedule, b: CleaningSchedule) => {
          return (
            new Date(a.cleaning_date).getTime() -
            new Date(b.cleaning_date).getTime()
          );
        }
      );
      setSchedules(sortedSchedules);
    } catch (err) {
      console.error("Error loading schedules:", err);
      setError("Failed to load cleaning schedules. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleChange = (scheduleId: string) => {
    setSelectedScheduleId(scheduleId);
    // If a schedule is selected, autofill the date from it
    if (scheduleId === "custom") {
      setCustomDate(new Date());
    } else {
      const selectedSchedule = schedules.find((s) => s.id === scheduleId);
      if (selectedSchedule) {
        setCustomDate(new Date(selectedSchedule.cleaning_date));
        
        // If session name is empty, generate a suggested name
        if (!sessionName) {
          const formattedDate = format(
            new Date(selectedSchedule.cleaning_date),
            "MMM d, yyyy"
          );
          setSessionName(
            `Ward Cleaning - ${formattedDate} - Group ${selectedSchedule.assigned_group}`
          );
        }
      }
    }
  };

  const formatScheduleOption = (schedule: CleaningSchedule) => {
    const date = new Date(schedule.cleaning_date);
    const formattedDate = format(date, "MMM d, yyyy");
    const [hours, minutes] = schedule.cleaning_time.split(":");
    const timeStr = `${hours}:${minutes}`;
    return `${formattedDate} ${timeStr} - Group ${schedule.assigned_group}`;
  };

  const handleCreate = async () => {
    // Validate inputs
    if (!sessionName.trim()) {
      setError("Please enter a session name");
      return;
    }

    if (!selectedScheduleId && !customDate) {
      setError("Please select a scheduled cleaning or set a custom date");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      const supabase = createClient();
      
      // Get current user - using getSession instead of getUser
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log("Authentication check:", { session, sessionError });
      
      if (sessionError) {
        throw sessionError;
      }
      
      if (!session || !session.user) {
        throw new Error("You must be logged in to create a session");
      }
      
      // Generate a random access code (6 characters)
      const publicAccessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Create the cleaning session using the user ID from the session
      const { data, error } = await supabase
        .from("cleaning_sessions")
        .insert({
          ward_branch_id: wardBranchId,
          schedule_id: selectedScheduleId === "custom" ? null : selectedScheduleId,
          session_name: sessionName,
          session_date: customDate?.toISOString().split("T")[0],
          public_access_code: publicAccessCode,
          status: "active",
          created_by: session.user.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Try to use the RPC function first
      const { error: tasksError } = await supabase.rpc(
        "create_session_tasks",
        { session_id: data.id }
      );

      // If the RPC function failed, fetch tasks and insert them directly
      if (tasksError) {
        console.log("RPC function failed, using fallback method:", tasksError);
        
        // Get all active tasks for this ward
        const { data: wardTasks, error: fetchError } = await supabase
          .from("ward_tasks")
          .select("id")
          .eq("ward_id", wardBranchId)
          .eq("active", true);
          
        if (fetchError) throw fetchError;
        
        // Prepare task data
        const taskInserts = wardTasks.map(task => ({
          session_id: data.id,
          task_id: task.id,
          status: "todo"
        }));
        
        // Insert tasks directly if there are any
        if (taskInserts.length > 0) {
          const { error: insertError } = await supabase
            .from("cleaning_session_tasks")
            .insert(taskInserts);
            
          if (insertError) throw insertError;
        }
      }

      toast.success("Cleaning session created successfully!");
      onSessionCreated(data.id);
      onClose();
    } catch (err: any) {
      console.error("Error creating session:", err);
      setError(`Failed to create cleaning session: ${err.message || 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle>Create New Cleaning Session</DialogTitle>
          <DialogDescription>
            Create a new cleaning session based on a schedule or custom date.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionName">Session Name</Label>
            <Input
              id="sessionName"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Enter session name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduleSelect">Scheduled Cleaning</Label>
            <Select
              value={selectedScheduleId}
              onValueChange={handleScheduleChange}
              disabled={isLoading}
            >
              <SelectTrigger id="scheduleSelect" className="w-full">
                <SelectValue placeholder="Select a scheduled cleaning" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading schedules...
                  </div>
                ) : schedules.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No upcoming scheduled cleanings
                  </div>
                ) : (
                  <>
                    {schedules.map((schedule) => (
                      <SelectItem key={schedule.id} value={schedule.id}>
                        {formatScheduleOption(schedule)}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom Date</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {(selectedScheduleId === "custom" || !selectedScheduleId) && (
            <div className="space-y-2">
              <Label htmlFor="datePicker">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !customDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDate ? (
                      format(customDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customDate}
                    onSelect={setCustomDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {selectedScheduleId && selectedScheduleId !== "custom" && (
            <div className="p-3 bg-muted rounded-md text-sm">
              <p className="font-medium">Selected Schedule Information:</p>
              {(() => {
                const schedule = schedules.find((s) => s.id === selectedScheduleId);
                if (schedule) {
                  return (
                    <>
                      <p>Date: {format(new Date(schedule.cleaning_date), "PPP")}</p>
                      <p>Time: {schedule.cleaning_time.substring(0, 5)}</p>
                      <p>Group: {schedule.assigned_group}</p>
                    </>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Session"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 