"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/utils/supabase/client";
import { Columns, List, Share2, User, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Confetti from "react-confetti";
import { toast } from "sonner";
import { PriorityIcon } from "./components/PriorityIcon";
import ShareSessionDialog from "./components/ShareSessionDialog";
import SignUpPrompt from "./components/SignUpPrompt";
import TaskCard from "./components/TaskCard";
import TaskDetail from "./components/TaskDetail";

// @ts-ignore - Disable TypeScript checks for this file

// Type definitions
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

interface CleaningSession {
  id: string;
  ward_branch_id: string;
  schedule_id?: string;
  session_name: string;
  session_date: string;
  public_access_code: string;
  status: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
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
  // Note: avatar_url isn't in the database table, we fetch it separately from user_profiles when needed
  avatar_url?: string; // This is added dynamically after fetching from the database
}

interface TaskViewer {
  id: string;
  session_task_id: string;
  participant_id: string;
  started_viewing_at: string;
  participant: SessionParticipant;
}

export default function TasksPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("sessionId");
  
  // States
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [session, setSession] = useState<CleaningSession | null>(null);
  const [sessionTasks, setSessionTasks] = useState<SessionTask[]>([]);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [selectedTask, setSelectedTask] = useState<SessionTask | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentParticipant, setCurrentParticipant] = useState<SessionParticipant | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  // Add a ref to always have the latest participants
  const participantsRef = useRef<SessionParticipant[]>(participants);
  // Add refs for currentUserId and currentParticipant
  const currentUserIdRef = useRef(currentUserId);
  const currentParticipantRef = useRef(currentParticipant);

  // Derived state for myTasks
  const [myTasks, setMyTasks] = useState<SessionTask[]>([]);

  // Group tasks by status
  const todoTasks = sessionTasks
    .filter(task => task.status === "todo")
    .sort((a, b) => {
      // Sort "Do First" items to the top
      if (a.task.priority === 'do_first' && b.task.priority !== 'do_first') return -1;
      if (a.task.priority !== 'do_first' && b.task.priority === 'do_first') return 1;
      // Sort "Do Last" items to the bottom
      if (a.task.priority === 'do_last' && b.task.priority !== 'do_last') return 1;
      if (a.task.priority !== 'do_last' && b.task.priority === 'do_last') return -1;
      // Default sort by title if priorities are the same
      return a.task.title.localeCompare(b.task.title);
    });

  const doingTasks = sessionTasks
    .filter(task => task.status === "doing")
    .sort((a, b) => {
      // Sort "Do First" items to the top
      if (a.task.priority === 'do_first' && b.task.priority !== 'do_first') return -1;
      if (a.task.priority !== 'do_first' && b.task.priority === 'do_first') return 1;
      // Sort "Do Last" items to the bottom
      if (a.task.priority === 'do_last' && b.task.priority !== 'do_last') return 1;
      if (a.task.priority !== 'do_last' && b.task.priority === 'do_last') return -1;
      // Default sort by title if priorities are the same
      return a.task.title.localeCompare(b.task.title);
    });

  const doneTasks = sessionTasks
    .filter(task => task.status === "done")
    .sort((a, b) => (a.completed_at && b.completed_at) 
      ? new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime() 
      : a.task.title.localeCompare(b.task.title)
    );
  
  // Show confetti when all tasks are complete
  useEffect(() => {
    if (sessionTasks.length > 0 && sessionTasks.every(task => task.status === "done") && !showConfetti) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [sessionTasks, showConfetti]);
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    
    checkAuth();
  }, [supabase]);
  
  // Show signup prompt for non-authenticated users
  useEffect(() => {
    if (!isAuthenticated && !localStorage.getItem("signupPromptShown")) {
      const timer = setTimeout(() => {
        setShowSignUpPrompt(true);
        localStorage.setItem("signupPromptShown", "true");
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);
  
  // Fetch upcoming session if no sessionId is provided or fetch the specific session
  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      
      try {
        let sessionData;
        
        if (sessionId) {
          // Fetch specific session if ID is provided
          const { data, error: sessionError } = await supabase
            .from("cleaning_sessions")
            .select("*")
            .eq("id", sessionId)
            .single();
            
          if (sessionError && sessionError.code !== 'PGRST116') throw sessionError;
          sessionData = data;
        }
        
        // If no session found or no sessionId provided, look for upcoming schedule
        // and create a session if needed
        if (!sessionData) {
          // Get the next upcoming cleaning schedule
          const today = new Date().toISOString().split('T')[0];
          const { data: scheduleData, error: scheduleError } = await supabase
            .from("cleaning_schedules")
            .select("*")
            .gte("cleaning_date", today)
            .order("cleaning_date", { ascending: true })
            .limit(1)
            .single();
            
          if (scheduleError && scheduleError.code !== 'PGRST116') throw scheduleError;
          
          if (scheduleData) {
            // Check if a session already exists for this schedule
            const { data: existingSession, error: existingSessionError } = await supabase
              .from("cleaning_sessions")
              .select("*")
              .eq("schedule_id", scheduleData.id)
              .single();
              
            if (existingSessionError && existingSessionError.code !== 'PGRST116') throw existingSessionError;
            
            if (existingSession) {
              // Use the existing session
              sessionData = existingSession;
            } else {
              // Create a new cleaning session based on the schedule
              const { data: { user } } = await supabase.auth.getUser();
              
              if (!user) {
                toast.error("Please sign in to create a cleaning session");
                setLoading(false);
                return;
              }
              
              // Format date for session name
              const scheduleDate = new Date(scheduleData.cleaning_date);
              const formattedDate = scheduleDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              });
              
              // Create a new cleaning session
              const { data: newSession, error: createSessionError } = await supabase
                .from("cleaning_sessions")
                .insert({
                  ward_branch_id: scheduleData.ward_branch_id,
                  schedule_id: scheduleData.id,
                  session_name: `Cleaning - ${formattedDate} - Group ${scheduleData.assigned_group}`,
                  session_date: scheduleData.cleaning_date,
                  public_access_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
                  status: "active",
                  created_by: user.id,
                })
                .select()
                .single();
                
              if (createSessionError) throw createSessionError;
              sessionData = newSession;
              
              // Now create tasks for this session based on ward_tasks
              const { data: wardTasks, error: tasksError } = await supabase
                .from("ward_tasks")
                .select("*")
                .eq("ward_id", scheduleData.ward_branch_id)
                .eq("active", true);
                
              if (tasksError) throw tasksError;
              
              if (wardTasks && wardTasks.length > 0) {
                // Prepare task data for insertion
                const sessionTasks = wardTasks.map((task: any) => ({
                  session_id: newSession.id,
                  task_id: task.id,
                  status: "todo",
                }));
                
                // Insert all tasks for this session
                const { error: insertTasksError } = await supabase
                  .from("cleaning_session_tasks")
                  .insert(sessionTasks);
                  
                if (insertTasksError) throw insertTasksError;
                
                toast.success("Created new cleaning session with tasks!");
              }
            }
          }
        }
        
        // If we found a session, set it and load tasks
        if (sessionData) {
          setSession(sessionData);
          
          // Update URL to include the session ID (without full page reload)
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('sessionId', sessionData.id);
          window.history.replaceState({}, '', newUrl.toString());
          
          // Fetch session tasks with task details
          const { data: tasksData, error: tasksError } = await supabase
            .from("cleaning_session_tasks")
            .select(`
              *,
              task:ward_tasks(*)
            `)
            .eq("session_id", sessionData.id);
            
          if (tasksError) throw tasksError;
          
          // Fetch participants
          const { data: participantsData, error: participantsError } = await supabase
            .from("session_participants")
            .select("*")
            .eq("session_id", sessionData.id);
            
          if (participantsError) throw participantsError;
          setParticipants(participantsData || []);
          
          // Map task assignees to tasks
          const enhancedTasks = tasksData ? tasksData.map((task: any) => {
            const assignee = participantsData?.find((p: any) => 
              (p.user_id && p.user_id === task.assigned_to) || 
              (p.temp_user_id && p.temp_user_id === task.assigned_to_temp_user)
            );
            
            return {
              ...task,
              assignee: assignee ? {
                display_name: assignee.display_name,
                avatar_url: assignee.avatar_url
              } : undefined
            };
          }) : [];
          
          setSessionTasks(enhancedTasks);
        }
      } catch (error) {
        console.error("Error fetching/creating session data:", error);
        toast.error("Failed to load or create session data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSession();
  }, [supabase, sessionId]);
  
  // Join session as participant
  useEffect(() => {
    if (!session) return;
    
    const joinSession = async () => {
      const currentSessionId = session.id;
      // Skip participant creation entirely if debugging is needed
      // return;

      try {
        // First, check if the session_participants table exists and is accessible
        try {
          const { count, error: countError } = await supabase
            .from("session_participants")
            .select("*", { count: "exact", head: true });
          
          if (countError) {
            console.error("Error checking participants table:", countError);
            // Continue anyway, but log the issue
          }
        } catch (tableCheckError) {
          console.error("Error accessing participants table:", tableCheckError);
          // Table might not exist or be inaccessible, abort participant creation
          return;
        }
        
        // For authenticated users
        if (isAuthenticated && currentUserId) {
          try {
            // Simplified approach: Just check if already exists
            const { data: existing } = await supabase
              .from("session_participants")
              .select("*")
              .eq("session_id", currentSessionId)
              .eq("user_id", currentUserId)
              .maybeSingle();
            
            if (existing) {
              // Just update last active time and set participant
              await supabase
                .from("session_participants")
                .update({ last_active_at: new Date().toISOString() })
                .eq("id", existing.id);
              
              setCurrentParticipant(existing);
            } else {
              // Get basic profile info if available
              const { data: profile } = await supabase
                .from("user_profiles")
                .select("first_name, last_name, avatar_url, username")
                .eq("user_id", currentUserId)
                .maybeSingle();
              
              // Create display name from first_name and last_name or use username
              const displayName = profile
                ? profile.username || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || "User"
                : "User";
              
              // Create participant record - IMPORTANT: avoid nullable/undefined fields
              const participantData = {
                session_id: currentSessionId,
                user_id: currentUserId,
                display_name: displayName,
                is_authenticated: true,
                last_active_at: new Date().toISOString()
              };
              
              try {
                const { data: newParticipant, error: insertError } = await supabase
                  .from("session_participants")
                  .insert(participantData)
                  .select()
                  .single();
                
                if (insertError) {
                  console.error("Error details for creating participant:", {
                    code: insertError.code,
                    details: insertError.details,
                    hint: insertError.hint,
                    message: insertError.message
                  });
                } else if (newParticipant) {
                  setCurrentParticipant(newParticipant);
                }
              } catch (insertErr) {
                console.error("Participant creation error:", insertErr);
                // Continue - user can still view tasks
              }
            }
          } catch (authUserError) {
            console.error("Error with authenticated user joining:", authUserError);
            // Continue anyway - user can still view tasks
          }
        } 
        // For anonymous users
        else {
          try {
            // Get or create temp user ID
            let tempUserId = localStorage.getItem(`tempUserId_${currentSessionId}`);
            
            if (!tempUserId) {
              tempUserId = `anon_${Math.random().toString(36).substring(2, 10)}`;
              localStorage.setItem(`tempUserId_${currentSessionId}`, tempUserId);
            }
            
            // Check if this temp user already joined
            const { data: existing } = await supabase
              .from("session_participants")
              .select("*")
              .eq("session_id", currentSessionId)
              .eq("temp_user_id", tempUserId)
              .maybeSingle();
            
            if (existing) {
              // Just update timestamp
              await supabase
                .from("session_participants")
                .update({ last_active_at: new Date().toISOString() })
                .eq("id", existing.id);
              
              setCurrentParticipant(existing);
            } else {
              // Simple guest name
              const guestNumber = Math.floor(Math.random() * 10000);
              const displayName = `Guest ${guestNumber}`;
              
              // Create minimal data
              const participantData = {
                session_id: currentSessionId,
                temp_user_id: tempUserId,
                display_name: displayName,
                is_authenticated: false,
                last_active_at: new Date().toISOString()
              };
              
              const { data: newParticipant, error: insertError } = await supabase
                .from("session_participants")
                .insert(participantData)
                .select()
                .single();
              
              if (insertError) {
                console.error("Error details for anonymous participant:", {
                  code: insertError.code,
                  details: insertError.details,
                  hint: insertError.hint,
                  message: insertError.message
                });
                throw new Error(`Database error: ${insertError.message || 'Unknown error'}`);
              }
              
              if (newParticipant) {
                setCurrentParticipant(newParticipant);
              }
            }
          } catch (anonUserError) {
            console.error("Error with anonymous user joining:", anonUserError);
            // Continue anyway - user can still view tasks
          }
        }
      } catch (error) {
        console.error("Failed to join session as participant:", error);
        // Don't show toast - just log it so the UX isn't interrupted
        // The user can still view tasks even if joining fails
      }
    };
    
    joinSession();
  }, [supabase, isAuthenticated, currentUserId, session]);
  
  // Setup real-time subscriptions
  useEffect(() => {
    if (!session) return;
    
    const currentSessionId = session.id;
    
    // Force a fresh supabase client for real-time connections
    const realtimeClient = createClient();
    
    // Subscribe to task changes
    const taskSubscription = realtimeClient
      .channel(`cleaning_session_tasks:${currentSessionId}`, {
        config: {
          broadcast: { self: true }  // Make sure we receive our own updates
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cleaning_session_tasks',
        filter: `session_id=eq.${currentSessionId}`
      }, async (payload: { 
        eventType: string; 
        new: any; 
        old: any; 
        table: string;
      }) => {
        // Handle task updates
        if (payload.eventType === 'UPDATE') {
          // For updates, fetch the complete updated task with task details and assignee
          const { data } = await supabase
            .from("cleaning_session_tasks")
            .select(`
              *,
              task:ward_tasks(*)
            `)
            .eq("id", payload.new.id)
            .single();
            
          if (data) {
            // Find the assignee information
            let assignee = undefined;
            if (data.assigned_to) {
              let participant = participantsRef.current.find(p => p.user_id === data.assigned_to);
              if (!participant) {
                // Fetch participant if not in current state
                const { data: fetched } = await supabase
                  .from("session_participants")
                  .select("*")
                  .eq("user_id", data.assigned_to)
                  .eq("session_id", currentSessionId)
                  .maybeSingle();
                participant = fetched;
                if (participant !== undefined) {
                  setParticipants(prev => [...prev, participant as SessionParticipant]);
                }
              }
              if (participant) {
                assignee = {
                  display_name: participant.display_name,
                  avatar_url: participant.avatar_url
                };
              }
            } else if (data.assigned_to_temp_user) {
              let participant = participantsRef.current.find(p => p.temp_user_id === data.assigned_to_temp_user);
              if (!participant) {
                // Fetch participant if not in current state
                const { data: fetched } = await supabase
                  .from("session_participants")
                  .select("*")
                  .eq("temp_user_id", data.assigned_to_temp_user)
                  .eq("session_id", currentSessionId)
                  .maybeSingle();
                participant = fetched;
                if (participant !== undefined) {
                  setParticipants(prev => [...prev, participant as SessionParticipant]);
                }
              }
              if (participant) {
                assignee = {
                  display_name: participant.display_name,
                  avatar_url: participant.avatar_url
                };
              }
            }
            // Update the task with assignee information
            const updatedTask = { ...data, assignee };
            setSessionTasks(prevTasks => {
              const exists = prevTasks.some(task => task.id === updatedTask.id);
              if (exists) {
                return prevTasks.map(task => task.id === updatedTask.id ? updatedTask : task);
              } else {
                return [...prevTasks, updatedTask];
              }
            });
          }
        } else if (payload.eventType === 'INSERT') {
          // Fetch the complete task data with task details
          const { data } = await supabase
            .from("cleaning_session_tasks")
            .select(`
              *,
              task:ward_tasks(*)
            `)
            .eq("id", payload.new.id)
            .single();
            
          if (data) {
            setSessionTasks(prevTasks => {
              const exists = prevTasks.some(task => task.id === data.id);
              if (exists) {
                return prevTasks.map(task => task.id === data.id ? data : task);
              } else {
                return [...prevTasks, data];
              }
            });
          }
        } else if (payload.eventType === 'DELETE') {
          setSessionTasks(prevTasks => 
            prevTasks.filter(task => task.id !== payload.old.id)
          );
        }
      })
      .subscribe();
      
    // Subscribe to participant changes
    const participantSubscription = realtimeClient
      .channel(`session_participants:${currentSessionId}`, {
        config: {
          broadcast: { self: true }  // Make sure we receive our own updates
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'session_participants',
        filter: `session_id=eq.${currentSessionId}`
      }, (payload: { 
        eventType: string; 
        new: any; 
        old: any;
      }) => {
        if (payload.eventType === 'UPDATE') {
          setParticipants(prevParticipants => 
            prevParticipants.map(participant => 
              participant.id === payload.new.id ? { ...participant, ...payload.new } : participant
            )
          );
        } else if (payload.eventType === 'INSERT') {
          setParticipants(prevParticipants => [...prevParticipants, payload.new as SessionParticipant]);
        } else if (payload.eventType === 'DELETE') {
          setParticipants(prevParticipants => 
            prevParticipants.filter(participant => participant.id !== payload.old.id)
          );
        }
      })
      .subscribe();
      
    // Subscribe to session changes
    const sessionSubscription = realtimeClient
      .channel(`cleaning_sessions:${currentSessionId}`, {
        config: {
          broadcast: { self: true }  // Make sure we receive our own updates
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'cleaning_sessions',
        filter: `id=eq.${currentSessionId}`
      }, (payload: {
        eventType: string;
        new: any;
        old: any;
      }) => {
        setSession(payload.new as CleaningSession);
        
        // Show confetti when session is completed
        if (payload.new.status === 'completed' && (!session || session.status !== 'completed')) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      })
      .subscribe();
    
    return () => {
      realtimeClient.removeChannel(taskSubscription);
      realtimeClient.removeChannel(participantSubscription);
      realtimeClient.removeChannel(sessionSubscription);
    };
  }, [supabase, session]);
  
  // Handle task selection
  const handleTaskClick = useCallback((task: SessionTask) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
    
    // Record that user is viewing this task
    if (currentParticipant) {
      // First check if we need to update the participant's display_name to use username
      if (isAuthenticated && currentUserId) {
        // Fetch the user's username to ensure consistent naming
        supabase
          .from("user_profiles")
          .select("username")
          .eq("user_id", currentUserId)
          .single()
          .then(({ data }: { data: { username?: string } | null }) => {
            // Only proceed if we found a username
            if (data?.username) {
              // If the participant's display_name doesn't match the username, update it
              if (currentParticipant.display_name !== data.username) {
                supabase
                  .from("session_participants")
                  .update({ display_name: data.username })
                  .eq("id", currentParticipant.id)
                  .then(() => {
                    // Don't need to do anything special here
                  });
              }
            }
          });
      }
    
      supabase
        .from("task_viewers")
        .upsert({
          session_task_id: task.id,
          participant_id: currentParticipant.id,
          started_viewing_at: new Date().toISOString()
        }, {
          onConflict: 'session_task_id,participant_id',
          ignoreDuplicates: false // Update the timestamp if record exists
        })
        .then(({ error }: { error: any }) => {
          if (error) console.error("Error recording task view:", error);
        });
    }
  }, [supabase, currentParticipant, isAuthenticated, currentUserId]);
  
  // Handle task detail close
  const handleTaskDetailClose = useCallback(() => {
    // Remove user from viewers when closing the detail view
    if (selectedTask && currentParticipant) {
      supabase
        .from("task_viewers")
        .delete()
        .match({
          session_task_id: selectedTask.id,
          participant_id: currentParticipant.id
        })
        .then(({ error }: { error: any }) => {
          if (error) console.error("Error removing task view:", error);
        });
    }
    
    setShowTaskDetail(false);
    setSelectedTask(null);
  }, [supabase, selectedTask, currentParticipant]);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);
  useEffect(() => {
    currentParticipantRef.current = currentParticipant;
  }, [currentParticipant]);

  useEffect(() => {
    setMyTasks(
      sessionTasks.filter(task => {
        if (isAuthenticated && currentUserIdRef.current) {
          return task.assigned_to === currentUserIdRef.current;
        } else if (currentParticipantRef.current?.temp_user_id) {
          return task.assigned_to_temp_user === currentParticipantRef.current.temp_user_id;
        }
        return false;
      })
    );
  }, [sessionTasks, isAuthenticated, currentUserId, currentParticipant]);

  // Instead of passing selectedTask directly, always use the latest from sessionTasks
  const selectedTaskFull = selectedTask
    ? sessionTasks.find(t => t.id === selectedTask.id) || selectedTask
    : null;

  // Close modal if selected task is deleted
  useEffect(() => {
    if (selectedTask && !sessionTasks.find(t => t.id === selectedTask.id)) {
      setShowTaskDetail(false);
      setSelectedTask(null);
    }
  }, [sessionTasks, selectedTask]);

  // Optimistically update a task in sessionTasks
  const optimisticUpdateTask = (taskId: string, updateData: Partial<SessionTask>) => {
    setSessionTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updateData } : task
      );
      return updatedTasks;
    });
  };

  // Clean up duplicate task viewers
  const cleanupDuplicateViewers = useCallback(async () => {
    try {
      setCleaningUp(true);
      const response = await fetch('/api/realtime-status?fix_duplicates=true');
      const result = await response.json();
      
      if (result.duplicateCleanupResult && result.duplicateCleanupResult.success) {
        const removed = result.duplicateCleanupResult.totalDuplicatesRemoved;
        if (removed > 0) {
          toast.success(`Cleaned up ${removed} duplicate viewer records`);
        } else {
          toast.info("No duplicate viewers found");
        }
      } else {
        toast.error("Failed to clean up duplicate viewers");
        console.error("Cleanup error:", result.duplicateCleanupResult?.error);
      }
    } catch (error) {
      console.error("Error cleaning up duplicate viewers:", error);
      toast.error("An error occurred while cleaning up viewers");
    } finally {
      setCleaningUp(false);
    }
  }, []);

  // Clear all task viewers when unmounting
  useEffect(() => {
    return () => {
      // Clean up any task viewers when component unmounts
      if (currentParticipant) {
        supabase
          .from("task_viewers")
          .delete()
          .eq("participant_id", currentParticipant.id)
          .then(({ error }: { error: any }) => {
            if (error) console.error("Error cleaning up task viewers on unmount:", error);
          });
      }
    };
  }, [supabase, currentParticipant]);

  if (!session && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <h1 className="text-2xl font-bold mb-4">No Cleaning Sessions Found</h1>
        <p className="text-muted-foreground mb-8 text-center max-w-md">
          There are no upcoming cleaning sessions scheduled. You can create a new session or check the schedule for upcoming cleanings.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => router.push("/app/schedule")}>
            View Schedule
          </Button>
          <Button variant="outline" onClick={() => router.push("/protected/tasks")}>
            Task Management
          </Button>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(col => (
            <div key={col} className="space-y-4">
              <Skeleton className="h-8 w-full" />
              {[1, 2, 3].map(task => (
                <Skeleton key={task} className="h-40 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full min-h-screen">
      {session?.status === "completed" && showConfetti && (
        <Confetti
          width={typeof window !== 'undefined' ? window.innerWidth : 1200}
          height={typeof window !== 'undefined' ? window.innerHeight : 800}
          recycle={false}
          numberOfPieces={500}
        />
      )}
      
      <main className="flex flex-col flex-grow p-4 md:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{session?.session_name}</h1>
            <p className="text-muted-foreground">
              {new Date(session?.session_date || "").toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "list")}>
              <TabsList>
                <TabsTrigger value="kanban" className="flex items-center gap-1">
                  <Columns size={16} />
                  <span className="hidden sm:inline">Kanban</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-1">
                  <List size={16} />
                  <span className="hidden sm:inline">List</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button variant="outline" size="icon" onClick={() => setShowShareDialog(true)}>
              <Share2 size={16} />
            </Button>
            
            {isAuthenticated && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={cleanupDuplicateViewers} 
                disabled={cleaningUp}
                title="Clean up duplicate viewers"
              >
                <Users size={16} />
              </Button>
            )}
          </div>
        </div>
        
        {(sessionTasks.length > 0 && sessionTasks.every(task => task.status === "done")) && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="flex flex-col items-center justify-center pt-6 pb-4">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <div className="rounded-full bg-green-200 p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">Cleaning Complete!</h2>
              <p className="text-green-700 text-center">
                Great job! All tasks have been completed successfully.
              </p>
            </CardContent>
          </Card>
        )}
        
        {myTasks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">My Assigned Tasks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onClick={() => handleTaskClick(task)} 
                />
              ))}
            </div>
          </div>
        )}
        
        {view === "kanban" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h2 className="font-semibold mb-4 flex items-center">
                To Do <Badge variant="outline" className="ml-2">{todoTasks.length}</Badge>
              </h2>
              <div className="space-y-4">
                {todoTasks.map((task, index) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onClick={() => handleTaskClick(task)}
                    orderNumber={index + 1}
                  />
                ))}
                {todoTasks.length === 0 && (
                  <div className="bg-muted/30 rounded-lg p-4 text-center text-muted-foreground">
                    No tasks to do
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h2 className="font-semibold mb-4 flex items-center">
                Doing <Badge variant="outline" className="ml-2">{doingTasks.length}</Badge>
              </h2>
              <div className="space-y-4">
                {doingTasks.map((task, index) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onClick={() => handleTaskClick(task)}
                    orderNumber={index + 1}
                  />
                ))}
                {doingTasks.length === 0 && (
                  <div className="bg-muted/30 rounded-lg p-4 text-center text-muted-foreground">
                    No tasks in progress
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h2 className="font-semibold mb-4 flex items-center">
                Done <Badge variant="outline" className="ml-2">{doneTasks.length}</Badge>
              </h2>
              <div className="space-y-4">
                {doneTasks.map((task, index) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onClick={() => handleTaskClick(task)}
                    // No order number for completed tasks
                  />
                ))}
                {doneTasks.length === 0 && (
                  <div className="bg-muted/30 rounded-lg p-4 text-center text-muted-foreground">
                    No completed tasks
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="font-semibold mb-4 flex items-center">
                To Do <Badge variant="outline" className="ml-2">{todoTasks.length}</Badge>
              </h2>
              <div className="space-y-2">
                {todoTasks.map((task, index) => (
                  <div 
                    key={task.id}
                    className="flex items-center gap-4 p-4 bg-card rounded-md border hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleTaskClick(task)}
                  >
                    <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-muted rounded-full">
                      <span className="text-xs font-medium">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{task.task.title}</div>
                      <div className="text-sm text-muted-foreground">{task.task.subtitle}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.task.priority && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <PriorityIcon priority={task.task.priority} className="h-3 w-3" />
                        </Badge>
                      )}
                      <Badge>To Do</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h2 className="font-semibold mb-4 flex items-center">
                Doing <Badge variant="outline" className="ml-2">{doingTasks.length}</Badge>
              </h2>
              <div className="space-y-2">
                {doingTasks.map((task, index) => (
                  <div 
                    key={task.id}
                    className="flex items-center gap-4 p-4 bg-card rounded-md border hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleTaskClick(task)}
                  >
                    <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-muted rounded-full">
                      <span className="text-xs font-medium">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{task.task.title}</div>
                      <div className="text-sm text-muted-foreground">{task.task.subtitle}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.task.priority && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <PriorityIcon priority={task.task.priority} className="h-3 w-3" />
                        </Badge>
                      )}
                      <Badge>In Progress</Badge>
                    </div>
                  </div>
                ))}
                {doingTasks.length === 0 && (
                  <div className="bg-muted/30 rounded-lg p-4 text-center text-muted-foreground">
                    No tasks in progress
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h2 className="font-semibold mb-4 flex items-center">
                Done <Badge variant="outline" className="ml-2">{doneTasks.length}</Badge>
              </h2>
              <div className="space-y-2">
                {doneTasks.map((task, index) => (
                  <div 
                    key={task.id}
                    className="flex items-center gap-4 p-4 bg-card rounded-md border hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleTaskClick(task)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{task.task.title}</div>
                      <div className="text-sm text-muted-foreground">{task.task.subtitle}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>Completed</Badge>
                      {task.completed_at && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(task.completed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {doneTasks.length === 0 && (
                  <div className="bg-muted/30 rounded-lg p-4 text-center text-muted-foreground">
                    No completed tasks
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="fixed bottom-6 right-6">
          <div className="flex flex-col gap-2">
            {!isAuthenticated && (
              <Button 
                onClick={() => router.push("/login?returnUrl=" + encodeURIComponent(`/tasks?sessionId=${sessionId}`))}
                className="shadow-lg"
              >
                <User className="mr-2 h-4 w-4" />
                Sign Up
              </Button>
            )}
          </div>
        </div>
      </main>
      
      {selectedTaskFull && (
        <TaskDetail
          sessionTask={selectedTaskFull}
          isOpen={showTaskDetail}
          onClose={handleTaskDetailClose}
          currentUserId={currentUserId}
          currentParticipant={currentParticipant}
          isAuthenticated={isAuthenticated}
          optimisticUpdateTask={optimisticUpdateTask}
        />
      )}
      
      <ShareSessionDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        sessionId={sessionId || ""}
        publicAccessCode={session?.public_access_code || ""}
      />
      
      <SignUpPrompt
        isOpen={showSignUpPrompt}
        onClose={() => setShowSignUpPrompt(false)}
      />
    </div>
  );
}