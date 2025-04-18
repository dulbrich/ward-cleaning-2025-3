"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { AvatarGroup } from "./AvatarGroup";
import { PriorityIcon } from "./PriorityIcon";

// Add this utility function for safely rendering HTML
function createMarkup(html: string) {
  return { __html: html };
}

interface WardTask {
  id: string;
  title: string;
  subtitle?: string;
  instructions: string;
  equipment: string;
  safety?: string;
  color?: string;
  priority?: string;
  kid_friendly?: boolean;
  points?: number;
}

interface SessionTask {
  id: string;
  session_id: string;
  task_id: string;
  status: "todo" | "doing" | "done";
  assigned_to?: string;
  assigned_to_temp_user?: string;
  assigned_at?: string;
  completed_at?: string;
  points_awarded?: number;
  task: WardTask;
  assignee?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface SessionParticipant {
  id: string;
  session_id: string;
  user_id?: string;
  temp_user_id?: string;
  display_name: string;
  is_authenticated: boolean;
  last_active_at: string;
  avatar_url?: string;
}

interface TaskViewer {
  id: string;
  session_task_id: string;
  participant_id: string;
  started_viewing_at: string;
  participant: SessionParticipant;
}

interface TaskDetailProps {
  sessionTask: SessionTask;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string | null;
  currentParticipant: SessionParticipant | null;
  isAuthenticated: boolean;
  optimisticUpdateTask: (taskId: string, updateData: Partial<SessionTask>) => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({
  sessionTask,
  isOpen,
  onClose,
  currentUserId,
  currentParticipant,
  isAuthenticated,
  optimisticUpdateTask,
}) => {
  const supabase = createClient();
  const [taskViewers, setTaskViewers] = useState<TaskViewer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAssignedToCurrentUser, setIsAssignedToCurrentUser] = useState(false);
  
  // Check if the task is assigned to the current user
  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      setIsAssignedToCurrentUser(sessionTask.assigned_to === currentUserId);
    } else if (currentParticipant?.temp_user_id) {
      setIsAssignedToCurrentUser(sessionTask.assigned_to_temp_user === currentParticipant.temp_user_id);
    } else {
      setIsAssignedToCurrentUser(false);
    }
  }, [sessionTask, currentUserId, currentParticipant, isAuthenticated]);
  
  // Fetch viewers of this task
  useEffect(() => {
    if (!isOpen || !sessionTask) return;
    
    const fetchTaskViewers = async () => {
      const { data, error } = await supabase
        .from("task_viewers")
        .select(`
          *,
          participant:session_participants(*)
        `)
        .eq("session_task_id", sessionTask.id);
        
      if (error) {
        console.error("Error fetching task viewers:", error);
      } else {
        setTaskViewers(data || []);
      }
    };
    
    fetchTaskViewers();
    
    // Setup real-time subscription for task viewers
    const taskViewersSubscription = supabase
      .channel(`task_viewers:${sessionTask.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'task_viewers',
        filter: `session_task_id=eq.${sessionTask.id}`
      }, (payload) => {
        console.log("TaskDetail real-time update received:", payload.eventType);
        
        if (payload.eventType === 'INSERT') {
          // Fetch the complete viewer data with participant details
          supabase
            .from("task_viewers")
            .select(`
              *,
              participant:session_participants(*)
            `)
            .eq("id", payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setTaskViewers(prev => [...prev, data]);
              }
            });
        } else if (payload.eventType === 'DELETE') {
          setTaskViewers(prev => 
            prev.filter(viewer => viewer.id !== payload.old.id)
          );
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(taskViewersSubscription);
    };
  }, [supabase, sessionTask, isOpen]);
  
  // Handle "Do Task" button click
  const handleDoTask = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      // Current timestamp for consistency
      const now = new Date().toISOString();
      
      // Create the update data object for optimistic UI update
      const uiUpdateData: Partial<SessionTask> = {
        status: "doing",
        assigned_at: now
      };
      
      let assignToUserId = null;
      let assignToTempUserId = null;
      
      // Add the appropriate assignment field
      if (isAuthenticated && currentUserId) {
        uiUpdateData.assigned_to = currentUserId;
        assignToUserId = currentUserId;
        
        // Add assignee info for UI
        if (currentParticipant) {
          uiUpdateData.assignee = {
            display_name: currentParticipant.display_name,
            avatar_url: currentParticipant.avatar_url
          };
        }
      } else if (currentParticipant?.temp_user_id) {
        uiUpdateData.assigned_to_temp_user = currentParticipant.temp_user_id;
        assignToTempUserId = currentParticipant.temp_user_id;
        
        // Add assignee info for UI
        uiUpdateData.assignee = {
          display_name: currentParticipant.display_name,
          avatar_url: currentParticipant.avatar_url
        };
      } else {
        toast.error("You need to be logged in to claim a task.");
        setLoading(false);
        return;
      }
      
      console.log("Task assignment data:", JSON.stringify(uiUpdateData));
      
      // Optimistically update the UI
      optimisticUpdateTask(sessionTask.id, uiUpdateData);
      
      // Close the modal for better responsiveness
      onClose();
      
      // Use the server API to update the task
      const response = await fetch('/api/tasks/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: sessionTask.id,
          assignToUserId,
          assignToTempUserId
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error("Server error assigning task:", result);
        
        if (response.status === 409) {
          // Conflict - someone else claimed it first
          toast.error("This task has already been claimed by someone else.");
        } else {
          throw new Error(result.error || "Failed to assign task");
        }
      } else {
        console.log("Task assignment successful:", result);
        toast.success("Task assigned to you!");
        
        // Apply the server response data if it includes the task
        if (result.task) {
          const serverTask = result.task;
          const serverAssignee = result.assignee;
          
          // Apply server data with assignee info
          optimisticUpdateTask(sessionTask.id, {
            ...serverTask,
            assignee: serverAssignee
          });
        }
      }
    } catch (error) {
      console.error("Error assigning task:", error);
      toast.error("Failed to assign task. Please try again.");
      
      // Revert the optimistic update on error
      optimisticUpdateTask(sessionTask.id, {
        status: "todo",
        assigned_to: undefined,
        assigned_to_temp_user: undefined,
        assigned_at: undefined,
        assignee: undefined
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle "Done" button click
  const handleTaskDone = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      // Close the modal immediately for better UX
      onClose();
      
      // Show loading toast
      const toastId = toast.loading("Completing task...");
      
      try {
        // Optimistically update the UI first for better responsiveness
        optimisticUpdateTask(sessionTask.id, {
          status: "done" as const,
          completed_at: new Date().toISOString()
        });
        
        // Use the server-side API endpoint that bypasses triggers
        const response = await fetch('/api/tasks/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taskId: sessionTask.id
          })
        });
        
        const result = await response.json();
        console.log("API response:", result);
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to complete task');
        }
        
        toast.success("Task completed successfully!", { id: toastId });
      } catch (error) {
        console.error("Error completing task:", error);
        toast.error(error instanceof Error ? error.message : "Failed to complete task", { id: toastId });
        
        // Task should remain marked as done in UI even if the server request fails
        // The optimistic update already did this for us
      }
    } catch (error) {
      console.error("Complete error details:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle "Cancel Task" button click - returns task to Todo list
  const handleCancelTask = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      // Define the update data for UI (using undefined to clear values)
      const uiUpdateData: Partial<SessionTask> = {
        status: "todo",
        assigned_to: undefined,
        assigned_to_temp_user: undefined,
        assigned_at: undefined
      };
      
      // Optimistically update the UI first
      optimisticUpdateTask(sessionTask.id, uiUpdateData);
      
      // Close the modal for better responsiveness
      onClose();
      
      // Then make the actual database update (using null for database)
      const { error } = await supabase
        .from("cleaning_session_tasks")
        .update({
          status: "todo",
          assigned_to: null,
          assigned_to_temp_user: null,
          assigned_at: null
        })
        .eq("id", sessionTask.id);
        
      if (error) throw error;
      
      toast.success("Task returned to To Do list");
    } catch (error) {
      console.error("Error canceling task:", error);
      toast.error("Failed to cancel task. Please try again.");
      
      // Revert the optimistic update if there was an error
      // Note: We don't have the original task data to revert to here, 
      // but the UI will refresh from the server via realtime subscription
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusBadge = () => {
    switch (sessionTask.status) {
      case "todo":
        return <Badge className="bg-blue-100 text-blue-800">To Do</Badge>;
      case "doing":
        return <Badge className="bg-amber-100 text-amber-800">In Progress</Badge>;
      case "done":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>{sessionTask.task.title}</DialogTitle>
            {getStatusBadge()}
          </div>
          {sessionTask.task.subtitle && (
            <DialogDescription>{sessionTask.task.subtitle}</DialogDescription>
          )}
        </DialogHeader>
        
        {/* Task viewers */}
        {taskViewers.length > 0 && (
          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-2">Currently viewing:</div>
            <AvatarGroup 
              viewers={taskViewers.map(v => ({
                name: v.participant.display_name,
                imageSrc: v.participant.avatar_url
              }))} 
            />
          </div>
        )}
        
        {/* Task details */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Instructions</h3>
            <div 
              className="text-sm text-muted-foreground prose prose-sm max-w-none"
              dangerouslySetInnerHTML={createMarkup(sessionTask.task.instructions)}
            />
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-1">Equipment Needed</h3>
            <div 
              className="text-sm text-muted-foreground prose prose-sm max-w-none" 
              dangerouslySetInnerHTML={createMarkup(sessionTask.task.equipment)}
            />
          </div>
          
          {sessionTask.task.safety && (
            <div>
              <h3 className="text-sm font-medium mb-1">Safety Guidelines</h3>
              <div 
                className="text-sm text-muted-foreground prose prose-sm max-w-none"
                dangerouslySetInnerHTML={createMarkup(sessionTask.task.safety)}
              />
            </div>
          )}
          
          {sessionTask.task.points && (
            <div className="text-sm">
              <span className="font-medium">Points: </span>
              <span className="text-muted-foreground">{sessionTask.task.points}</span>
            </div>
          )}
          
          {/* Priority info */}
          {sessionTask.task.priority && (
            <div className="text-sm flex items-center gap-2">
              <span className="font-medium">Priority: </span>
              <div className="flex items-center gap-1">
                <PriorityIcon priority={sessionTask.task.priority} className="h-4 w-4" />
                <span className="text-muted-foreground">
                  {sessionTask.task.priority === 'do_first' ? 'Do First' : 
                   sessionTask.task.priority === 'do_last' ? 'Do Last' : 
                   sessionTask.task.priority === 'normal' ? 'Normal' : 'Priority'}
                </span>
              </div>
            </div>
          )}
          
          {/* Kid-friendly status - only show if true */}
          {sessionTask.task.kid_friendly && (
            <div className="text-sm flex items-center gap-2">
              <span className="font-medium">Suitable for: </span>
              <span className="text-green-600">
                Kids (Kid-friendly)
              </span>
            </div>
          )}
          
          {sessionTask.assignee && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Assigned to:</span>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={sessionTask.assignee.avatar_url} />
                  <AvatarFallback>
                    {sessionTask.assignee.display_name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{sessionTask.assignee.display_name}</span>
              </div>
            </div>
          )}
          
          {/* Task history */}
          {sessionTask.status === "done" && sessionTask.completed_at && (
            <div className="bg-green-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-green-800 mb-2">Task Completed</h3>
              <div className="text-sm text-green-700">
                {sessionTask.assignee 
                  ? `Completed by ${sessionTask.assignee.display_name} on ${new Date(sessionTask.completed_at).toLocaleString()}`
                  : `Completed on ${new Date(sessionTask.completed_at).toLocaleString()}`
                }
              </div>
              {sessionTask.points_awarded && (
                <div className="text-sm text-green-700 mt-1">
                  {sessionTask.points_awarded} points awarded
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="pt-4">
          {sessionTask.status === "todo" && (
            <Button
              onClick={handleDoTask}
              disabled={loading}
            >
              Do Task
            </Button>
          )}
          
          {sessionTask.status === "doing" && isAssignedToCurrentUser && (
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <Button
                onClick={handleCancelTask}
                disabled={loading}
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                Cancel Task
              </Button>
              
              <Button
                onClick={handleTaskDone}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                Mark as Done
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetail; 