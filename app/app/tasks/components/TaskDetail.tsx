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
  
  // Fetch the assigned user's profile details if needed
  useEffect(() => {
    // Only run this for tasks with an authenticated user assignment but missing proper assignee details
    const needsUserProfileDetails = sessionTask.status !== 'todo' && 
                                   sessionTask.assigned_to && 
                                   (!sessionTask.assignee?.avatar_url || !sessionTask.assignee?.display_name);
                                   
    if (!needsUserProfileDetails) return;
    
    const fetchUserProfile = async () => {
      try {
        const { data: userProfile, error } = await supabase
          .from("user_profiles")
          .select("first_name, last_name, avatar_url, username")
          .eq("user_id", sessionTask.assigned_to)
          .single();
          
        if (error) {
          console.error("Error fetching user profile:", error);
          return;
        }
          
        if (userProfile) {
          // Construct display name from first_name and last_name or use username
          const displayName = userProfile.username || 
                             `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 
                             "User";
                             
          // Update the task with the user profile information
          optimisticUpdateTask(sessionTask.id, {
            assignee: {
              display_name: displayName,
              avatar_url: userProfile.avatar_url
            }
          });
        }
      } catch (error) {
        console.error("Error fetching user profile for assigned task:", error);
      }
    };
    
    fetchUserProfile();
  }, [sessionTask, supabase, optimisticUpdateTask]);
  
  // Fetch viewers of this task
  useEffect(() => {
    if (!isOpen || !sessionTask) return;
    
    let isMounted = true;
    
    const fetchTaskViewers = async () => {
      try {
        // Get the updated participant info
        const { data: participants, error: participantsError } = await supabase
          .from("session_participants")
          .select("*")
          .in("id", currentParticipant ? [currentParticipant.id] : []);
          
        if (participantsError) {
          console.error("Error fetching updated participants:", participantsError);
        }
        
        // First, try to directly get the current user's avatar from user_profiles
        let currentUserAvatar = '';
        if (isAuthenticated && currentUserId) {
          try {
            const { data: userProfile } = await supabase
              .from("user_profiles")
              .select("avatar_url")
              .eq("user_id", currentUserId)
              .single();
              
            if (userProfile?.avatar_url) {
              currentUserAvatar = userProfile.avatar_url;
            }
          } catch (error) {
            console.error("Error fetching user profile:", error);
          }
        }
        
        // Now fetch task viewers
        const { data, error } = await supabase
          .from("task_viewers")
          .select(`
            *,
            participant:session_participants(*)
          `)
          .eq("session_task_id", sessionTask.id);
          
        if (error) {
          console.error("Error fetching task viewers:", error);
          return;
        }
        
        if (!isMounted) return;
        
        // Process viewers synchronously first to avoid React errors
        // Deduplicate viewers by participant_id to prevent multiple instances of the same user
        const viewersByParticipant = new Map();
        
        // First pass: collect viewers by user_id if authenticated, otherwise by temp_user_id or participant_id
        data?.forEach((viewer: any) => {
          const participantData = viewer.participant || {};
          
          // Create a unique identifier based on user identity rather than participant ID
          // This ensures that multiple entries from the same user (but different participant records) are consolidated
          let uniqueId: string;
          
          if (participantData.user_id) {
            // For authenticated users, use their user_id as the key
            uniqueId = `user_${participantData.user_id}`;
          } else if (participantData.temp_user_id) {
            // For anonymous users, use their temp_user_id
            uniqueId = `temp_${participantData.temp_user_id}`;
          } else {
            // Fallback to participant_id if neither is available
            uniqueId = `participant_${participantData.id}`;
          }
          
          // Skip if we already have this user (keeping only the first/latest entry)
          if (!viewersByParticipant.has(uniqueId)) {
            const isCurrentUser = (isAuthenticated && currentUserId && participantData.user_id === currentUserId) ||
                                (!isAuthenticated && currentParticipant && participantData.id === currentParticipant.id);
            
            // For current user: Use the directly fetched avatar 
            if (isCurrentUser && currentUserAvatar) {
              viewersByParticipant.set(uniqueId, {
                ...viewer,
                participant: {
                  ...participantData,
                  avatar_url: currentUserAvatar
                }
              });
            } else {
              // For other users, use data without avatar for now (we'll load them later)
              viewersByParticipant.set(uniqueId, {
                ...viewer,
                participant: {
                  ...participantData,
                  avatar_url: participantData.avatar_url || undefined
                }
              });
            }
          }
        });
        
        // Set initial data so UI renders immediately with deduplicated viewers
        if (isMounted) {
          setTaskViewers(Array.from(viewersByParticipant.values()));
        }
        
        // Then, update avatars one by one for authenticated users
        if (data && isMounted) {
          // Create a map to track which users we've already processed for avatars
          const processedUsers = new Set();
          
          for (const viewer of data) {
            const participantData = viewer.participant || {};
            
            // Skip if no user_id (anonymous users) or not authenticated
            if (!participantData.user_id || !participantData.is_authenticated) {
              continue;
            }
            
            // Skip users we've already processed
            if (processedUsers.has(participantData.user_id)) continue;
            processedUsers.add(participantData.user_id);
            
            // Skip current user (already handled)
            if (participantData.user_id === currentUserId) continue;
            
            try {
              const { data: profile } = await supabase
                .from("user_profiles")
                .select("avatar_url, username")
                .eq("user_id", participantData.user_id)
                .single();
                
              if (profile?.avatar_url && isMounted) {
                // Update this specific viewer with avatar, matching by user_id
                setTaskViewers(prev => 
                  prev.map(v => 
                    v.participant?.user_id === participantData.user_id 
                      ? {
                          ...v,
                          participant: {
                            ...v.participant,
                            avatar_url: profile.avatar_url,
                            // Ensure we use username consistently to solve the hover issue
                            display_name: profile.username || v.participant?.display_name
                          }
                        } 
                      : v
                  )
                );
              }
            } catch (error) {
              // Silently fail, avatar will stay null
            }
          }
        }
      } catch (error) {
        console.error("Error in fetchTaskViewers:", error);
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
      }, (payload: any) => {
        if (!isMounted) return;
        
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
            .then(({ data }: { data: TaskViewer | null }) => {
              if (!data || !isMounted) return;
              
              // Add without avatar first
              const initialData = {
                ...data,
                participant: {
                  ...data.participant,
                  avatar_url: data.participant?.avatar_url || undefined
                }
              };
              
              // Check if this user is already in the list to avoid duplicates
              setTaskViewers(prev => {
                // For consistent deduplication, match on user_id or temp_user_id instead of participant_id
                const participantData = data.participant;
                if (!participantData) return [...prev, initialData];
                
                const existingIndex = prev.findIndex(viewer => {
                  const vParticipant = viewer.participant;
                  if (!vParticipant) return false;
                  
                  // Match authenticated users by user_id
                  if (participantData.user_id && vParticipant.user_id) {
                    return participantData.user_id === vParticipant.user_id;
                  }
                  
                  // Match anonymous users by temp_user_id
                  if (participantData.temp_user_id && vParticipant.temp_user_id) {
                    return participantData.temp_user_id === vParticipant.temp_user_id;
                  }
                  
                  // Fallback to participant_id
                  return participantData.id === vParticipant.id;
                });
                
                // This user is already in the list - don't add it
                if (existingIndex >= 0) return prev;
                
                // New user - add it
                return [...prev, initialData];
              });
              
              // Then fetch avatar and username if needed
              if (data.participant?.user_id && data.participant?.is_authenticated) {
                supabase
                  .from("user_profiles")
                  .select("avatar_url, username")
                  .eq("user_id", data.participant.user_id)
                  .single()
                  .then(({ data: profile }: { data: { avatar_url?: string, username?: string } | null }) => {
                    if (!isMounted || !profile?.avatar_url) return;
                    
                    // Update with avatar and consistent username
                    setTaskViewers(prev => 
                      prev.map(v => 
                        v.participant?.user_id === initialData.participant?.user_id 
                          ? {
                              ...v,
                              participant: {
                                ...v.participant,
                                avatar_url: profile.avatar_url,
                                // Ensure we use username consistently
                                display_name: profile.username || v.participant?.display_name
                              }
                            } 
                          : v
                      )
                    );
                  })
                  .catch((error: Error) => {
                    console.error("Error fetching new task viewer:", error);
                  });
              }
            })
            .catch((error: Error) => {
              console.error("Error fetching new task viewer:", error);
            });
        } else if (payload.eventType === 'DELETE') {
          setTaskViewers(prev => 
            prev.filter(viewer => viewer.id !== payload.old.id)
          );
        }
      })
      .subscribe();
      
    return () => {
      isMounted = false;
      supabase.removeChannel(taskViewersSubscription);
    };
  }, [supabase, sessionTask, isOpen, currentParticipant, currentUserId, isAuthenticated]);
  
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
      let displayName = currentParticipant?.display_name || "User";
      let avatarUrl: string | undefined = undefined;
      
      // Add the appropriate assignment field
      if (isAuthenticated && currentUserId) {
        uiUpdateData.assigned_to = currentUserId;
        assignToUserId = currentUserId;
        
        // Get user profile data for better display
        try {
          const { data: userProfile, error: profileError } = await supabase
            .from("user_profiles")
            .select("first_name, last_name, avatar_url, username")
            .eq("user_id", currentUserId)
            .single();
          
          if (!profileError && userProfile) {
            // Use username or fallback to display name
            displayName = userProfile.username || 
                        `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 
                        displayName;
            
            // Use avatar URL if available
            avatarUrl = userProfile.avatar_url;
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else if (currentParticipant?.temp_user_id) {
        uiUpdateData.assigned_to_temp_user = currentParticipant.temp_user_id;
        assignToTempUserId = currentParticipant.temp_user_id;
        displayName = currentParticipant.display_name;
      } else {
        toast.error("You need to be logged in to claim a task.");
        setLoading(false);
        return;
      }
      
      // Add assignee info with fetched data
      uiUpdateData.assignee = {
        display_name: displayName,
        avatar_url: avatarUrl
      };
      
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
      
      // Ensure we have user info for the completion record
      let assigneeInfo = sessionTask.assignee;
      
      // If no assignee info and task is assigned to current user, try to fetch it
      if ((!assigneeInfo?.avatar_url || !assigneeInfo?.display_name) && 
          isAuthenticated && currentUserId === sessionTask.assigned_to) {
        try {
          const { data: userProfile, error } = await supabase
            .from("user_profiles")
            .select("avatar_url, username, first_name, last_name")
            .eq("user_id", currentUserId)
            .single();
            
          if (!error && userProfile) {
            const displayName = userProfile.username || 
                             `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 
                             "User";
                             
            assigneeInfo = {
              display_name: displayName,
              avatar_url: userProfile.avatar_url
            };
          }
        } catch (profileError) {
          console.error("Error fetching user profile for task completion:", profileError);
          // Continue with existing assignee info or fallback
        }
      }
      
      try {
        // Optimistically update the UI first for better responsiveness
        optimisticUpdateTask(sessionTask.id, {
          status: "done" as const,
          completed_at: new Date().toISOString(),
          assignee: assigneeInfo
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
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to complete task');
        }
        
        toast.success("Task completed successfully!", { id: toastId });
      } catch (error) {
        console.error("Error completing task:", error);
        toast.error(error instanceof Error ? error.message : "Failed to complete task", { id: toastId });
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
  
  // Helper function to get the proper avatar URL
  const getAvatarUrl = (avatarPath?: string): string => {
    if (!avatarPath) return '';
    
    if (avatarPath.startsWith('http')) {
      // Already a complete URL
      return avatarPath;
    } else if (avatarPath.startsWith('/')) {
      // A site-relative path
      return avatarPath;
    } else {
      // Assume it's a relative path to avatars
      return `/images/avatars/${avatarPath}`;
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center pr-8">
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
              viewers={taskViewers.map(viewer => {
                const name = viewer.participant?.display_name || 'User';
                const avatarPath = viewer.participant?.avatar_url;
                return {
                  name: name,
                  imageSrc: avatarPath || ''
                };
              })} 
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
                <Avatar className="h-8 w-8">
                  {sessionTask.assignee?.avatar_url && (
                    <AvatarImage 
                      src={getAvatarUrl(sessionTask.assignee.avatar_url)} 
                      alt={sessionTask.assignee.display_name || "User"}
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                  <AvatarFallback>
                    {(sessionTask.assignee.display_name || "User").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{sessionTask.assignee.display_name}</span>
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