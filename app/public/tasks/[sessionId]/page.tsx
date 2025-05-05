"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/utils/supabase/client";
import {
    createParticipantWithServiceRole,
    fetchWardTasksWithServiceRole,
    recordAnonymousTaskView,
    removeAnonymousTaskView
} from "@/utils/supabase/serviceClient";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "../../../../components/ui/use-toast";

import AnonymousOnboardingModal from "../components/AnonymousOnboardingModal";
import AnonymousTasksLayout from "../components/AnonymousTasksLayout";
import GuestLimitationsTooltip from "../components/GuestLimitationsTooltip";
import GuestProfileSetup from "../components/GuestProfileSetup";
import SessionQRCode from "../components/SessionQRCode";

// Import existing TaskCard from the main app
import TaskCard from "@/app/app/tasks/components/TaskCard";

// Lazy load TaskDetail component for better initial performance
const TaskDetail = dynamic(
  () => import("@/app/app/tasks/components/TaskDetail").catch(err => {
    console.error("Error loading TaskDetail component:", err);
    return () => (
      <div className="bg-destructive/20 p-4 rounded-lg">
        Error loading task details. Please try again.
      </div>
    );
  }),
  { 
    loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center"><Skeleton className="h-96 w-96 max-w-md rounded-lg" /></div>,
    ssr: false
  }
);

// Define types locally instead of importing from main app
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

interface CleaningSession {
  id: string;
  session_name: string;
  session_date: string;
  status: string;
  created_by: string;
  public_access_code: string;
  completed_at?: string;
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

export default function AnonymousTasksPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const { toast } = useToast();
  const supabase = createClient();

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [session, setSession] = useState<CleaningSession | null>(null);
  const [sessionTasks, setSessionTasks] = useState<SessionTask[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState<SessionParticipant | null>(null);
  const [selectedTask, setSelectedTask] = useState<SessionTask | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [serverUrl, setServerUrl] = useState("");

  // Set server URL for QR code generation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setServerUrl(`${window.location.protocol}//${window.location.host}`);
    }
  }, []);

  // Check if the user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // If user is authenticated, redirect to the regular tasks page
        router.push(`/app/tasks?sessionId=${sessionId}`);
      } else {
        // Check for existing temp user
        const tempUserId = localStorage.getItem(`tempUserId_${sessionId}`);
        if (tempUserId) {
          setIsReturningUser(true);
        } else {
          // Show onboarding for new users
          setShowOnboarding(true);
        }
      }
    };
    
    checkAuth();
  }, [supabase, router, sessionId]);

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true);
      
      try {
        // Fetch session data
        const { data: sessionData, error: sessionError } = await supabase
          .from("cleaning_sessions")
          .select("*")
          .eq("id", sessionId)
          .single();
          
        if (sessionError) throw sessionError;
        if (!sessionData) throw new Error("Session not found");
        
        setSession(sessionData);
        
        // First fetch all tasks for this session (no joins yet)
        const { data: sessionTasks, error: sessionTasksError } = await supabase
          .from("cleaning_session_tasks")
          .select("*")
          .eq("session_id", sessionId);
        
        if (sessionTasksError) throw sessionTasksError;
        if (!sessionTasks || sessionTasks.length === 0) {
          // No tasks to display
          setSessionTasks([]);
          console.log("No tasks found for this session");
          return;
        }
        
        // Get all task IDs to fetch details
        const taskIds = sessionTasks.map((task: any) => task.task_id).filter(Boolean);
        
        if (taskIds.length === 0) {
          console.error("No task IDs found in session tasks");
          setSessionTasks([]);
          return;
        }
        
        // Use the service client to fetch ward tasks instead of the regular supabase client
        // to bypass RLS for anonymous users
        const { data: taskDetails, error: taskDetailsError } = await fetchWardTasksWithServiceRole(taskIds);
        
        if (taskDetailsError) throw taskDetailsError;
        
        // Create a map for quick lookup
        const taskDetailsMap: Record<string, any> = {};
        if (taskDetails) {
          for (const task of taskDetails as any[]) {
            if (task && task.id) {
              taskDetailsMap[task.id] = task;
            }
          }
        }
        
        // Join the tasks with their details
        const fullTasks = (sessionTasks as any[]).map((sessionTask) => {
          const taskDetail = taskDetailsMap[sessionTask.task_id];
          if (!taskDetail) {
            // Create a placeholder task record with basic info
            return {
              ...sessionTask,
              task: {
                id: sessionTask.task_id,
                title: `Task ${sessionTask.task_id.substring(0, 6)}`,
                subtitle: "Details unavailable",
                instructions: "This task's details could not be loaded.",
                equipment: "Unknown",
                priority: "normal"
              }
            };
          }
          
          return {
            ...sessionTask,
            task: taskDetail,
          };
        }) as SessionTask[];
        
        // Fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from("session_participants")
          .select("*")
          .eq("session_id", sessionId);
          
        if (participantsError) throw participantsError;
        setParticipants(participantsData || []);
        
        // Enhance tasks with assignee information and ensure all tasks have complete data
        const enhancedTasks = fullTasks.map((task: SessionTask) => {
          const assignee = participantsData?.find((p: any) => 
            (p.user_id && p.user_id === task.assigned_to) || 
            (p.temp_user_id && p.temp_user_id === task.assigned_to_temp_user)
          );
          
          // Check if task data is complete
          const isTaskDataComplete = task.task && 
            task.task.title && 
            task.task.instructions && 
            task.task.equipment;
          
          // Create a sanitized task object
          const taskWithAssignee = {
            ...task,
            assignee: assignee ? {
              display_name: assignee.display_name,
              avatar_url: assignee.avatar_url
            } : undefined
          };
          
          // If task data is incomplete, add default values
          if (!isTaskDataComplete) {
            return {
              ...taskWithAssignee,
              task: {
                id: task.task_id,
                title: task.task?.title || `Task ${task.task_id.substring(0, 6)}`,
                subtitle: task.task?.subtitle || "Details unavailable",
                instructions: task.task?.instructions || "Task details could not be loaded properly.",
                equipment: task.task?.equipment || "Unknown",
                safety: task.task?.safety || "Exercise caution when performing this task.",
                priority: task.task?.priority || "normal",
                kid_friendly: task.task?.kid_friendly || false,
                points: task.task?.points || 5
              }
            };
          }
          
          return taskWithAssignee;
        });

        setSessionTasks(enhancedTasks);
        
        // Check for returning user
        if (isReturningUser) {
          const tempUserId = localStorage.getItem(`tempUserId_${sessionId}`);
          
          if (!tempUserId) {
            setIsReturningUser(false);
            setShowOnboarding(true);
            return;
          }
          
          const { data: existingParticipant, error: participantError } = await supabase
            .from("session_participants")
            .select("*")
            .eq("session_id", sessionId)
            .eq("temp_user_id", tempUserId)
            .maybeSingle();
            
          if (participantError) throw participantError;
          
          if (existingParticipant) {
            // Update last active time
            await supabase
              .from("session_participants")
              .update({ last_active_at: new Date().toISOString() })
              .eq("id", existingParticipant.id);
              
            setCurrentParticipant(existingParticipant);
            
            toast({
              title: "Welcome back!",
              description: `You're back as ${existingParticipant.display_name}. Your progress has been saved.`,
              duration: 5000,
            });
          } else {
            // Temp user not found in database, show profile setup
            localStorage.removeItem(`tempUserId_${sessionId}`);
            setIsReturningUser(false);
            setShowOnboarding(true);
          }
        }
      } catch (error) {
        console.error("Error fetching session data:", error);
        toast({
          title: "Error",
          description: "Failed to load session data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (sessionId) {
      fetchSession();
    }
  }, [supabase, sessionId, isReturningUser, toast]);

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
              // For authenticated users
              let participant = participants.find(p => p.user_id === data.assigned_to);
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
                  // Update participants list with proper type checking
                  setParticipants(prev => participant ? [...prev, participant as SessionParticipant] : prev);
                }
              }
              
              if (participant) {
                assignee = {
                  display_name: participant.display_name,
                  avatar_url: participant.avatar_url
                };
              }
            } else if (data.assigned_to_temp_user) {
              // For guest/anonymous users
              let participant = participants.find(p => p.temp_user_id === data.assigned_to_temp_user);
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
                  // Update participants list with proper type checking
                  setParticipants(prev => participant ? [...prev, participant as SessionParticipant] : prev);
                }
              }
              
              if (participant) {
                assignee = {
                  display_name: participant.display_name,
                  avatar_url: participant.avatar_url
                };
              }
            }
            
            const taskWithDetails = {
              ...data,
              assignee,
              task: data.task
            };
            
            setSessionTasks(prevTasks => {
              const exists = prevTasks.some(task => task.id === taskWithDetails.id);
              if (exists) {
                return prevTasks.map(task => task.id === taskWithDetails.id ? taskWithDetails : task);
              } else {
                return [...prevTasks, taskWithDetails];
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
            // If task details are missing, fetch them using service client
            if (!data.task || !data.task.id) {
              const { data: taskDetails } = await fetchWardTasksWithServiceRole([data.task_id]);
              if (taskDetails && taskDetails.length > 0) {
                data.task = taskDetails[0];
              }
            }
            
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
      })
      .subscribe();
    
    return () => {
      realtimeClient.removeChannel(taskSubscription);
      realtimeClient.removeChannel(participantSubscription);
      realtimeClient.removeChannel(sessionSubscription);
    };
  }, [supabase, session, participants, sessionId]);
  
  // In case task gets deleted
  useEffect(() => {
    if (selectedTask && !sessionTasks.find(t => t.id === selectedTask.id)) {
      setShowTaskDetail(false);
      setSelectedTask(null);
    }
  }, [sessionTasks, selectedTask]);

  // Add an effect to fetch participant details for tasks that need them
  useEffect(() => {
    // Function to fetch participant details for all tasks that need them
    const fetchParticipantDetails = async () => {
      // Find tasks that need participant details (have assigned_to or assigned_to_temp_user but no assignee)
      const tasksNeedingDetails = sessionTasks.filter(task => 
        (task.assigned_to || task.assigned_to_temp_user) && !task.assignee
      );
      
      if (tasksNeedingDetails.length === 0) return;
      
      // Fetch all participant data
      const { data: allParticipants, error } = await supabase
        .from("session_participants")
        .select("*")
        .eq("session_id", sessionId);
        
      if (error || !allParticipants) {
        console.error("Error fetching participants:", error);
        return;
      }
      
      // Update tasks with assignee information
      setSessionTasks(prevTasks => {
        return prevTasks.map(task => {
          // Skip tasks that already have assignee info
          if (task.assignee) return task;
          
          let assigneeParticipant;
          
          // Find the participant for this task
          if (task.assigned_to) {
            assigneeParticipant = allParticipants.find((p: SessionParticipant) => p.user_id === task.assigned_to);
          } else if (task.assigned_to_temp_user) {
            assigneeParticipant = allParticipants.find((p: SessionParticipant) => p.temp_user_id === task.assigned_to_temp_user);
          }
          
          // If found, add the assignee info
          if (assigneeParticipant) {
            return {
              ...task,
              assignee: {
                display_name: assigneeParticipant.display_name,
                avatar_url: assigneeParticipant.avatar_url
              }
            };
          }
          
          return task;
        });
      });
    };
    
    if (sessionId && sessionTasks.length > 0) {
      fetchParticipantDetails();
    }
  }, [supabase, sessionId, sessionTasks]);

  // Function to record a task view
  const recordTaskView = useCallback((task: SessionTask) => {
    if (!currentParticipant) return;
    
    if (currentParticipant.is_authenticated) {
      // For authenticated users, use the standard supabase client
      try {
        supabase
          .from("task_viewers")
          .upsert({
            session_task_id: task.id,
            participant_id: currentParticipant.id,
            started_viewing_at: new Date().toISOString()
          }, {
            onConflict: 'session_task_id,participant_id',
            ignoreDuplicates: false
          })
          .then(({ error }: { error: any }) => {
            if (error) console.error("Error recording task view:", error);
          })
          .catch((err: any) => {
            console.error("Error recording task view:", err);
          });
      } catch (err) {
        console.error("Exception recording task view:", err);
      }
    } else {
      // For anonymous users, use the service client function
      recordAnonymousTaskView({
        session_task_id: task.id,
        participant_id: currentParticipant.id,
        started_viewing_at: new Date().toISOString()
      }).catch(err => {
        console.error("Error recording anonymous task view:", err);
      });
    }
  }, [supabase, currentParticipant]);

  // Update the updateTaskWithFallback function call to pass all participant info
  const handleTaskClick = useCallback(async (taskId: string) => {
    const task = sessionTasks.find(t => t.id === taskId);
    if (!task) return;
    
    setSelectedTask(task);
    setShowTaskDetail(true);
    
    // Record the task view when a task is clicked
    if (currentParticipant) {
      recordTaskView(task);
    }
  }, [sessionTasks, currentParticipant, recordTaskView]);

  // Handle task detail close
  const handleTaskDetailClose = useCallback(() => {
    // Remove user from viewers when closing the detail view
    if (selectedTask && currentParticipant) {
      if (currentParticipant.is_authenticated) {
        // For authenticated users, use the standard supabase client
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
      } else {
        // For anonymous users, use the service client function
        removeAnonymousTaskView({
          session_task_id: selectedTask.id,
          participant_id: currentParticipant.id
        }).catch(err => {
          console.error("Error removing anonymous task view:", err);
        });
      }
    }
    
    setShowTaskDetail(false);
    setSelectedTask(null);
  }, [supabase, selectedTask, currentParticipant]);

  // Handle "Continue as Guest" from onboarding modal
  const handleContinueAsGuest = useCallback(() => {
    setShowOnboarding(false);
    setShowProfileSetup(true);
  }, []);

  // Handle profile setup completion
  const handleProfileComplete = useCallback(async (profile: {
    tempUserId: string;
    displayName: string;
    avatarUrl: string;
  }) => {
    try {
      // Use our service role client to bypass RLS
      const { data: newParticipant, error } = await createParticipantWithServiceRole({
        session_id: sessionId,
        temp_user_id: profile.tempUserId,
        display_name: profile.displayName,
        avatar_url: profile.avatarUrl,
        is_authenticated: false,
        last_active_at: new Date().toISOString()
      });
        
      if (error) {
        throw error;
      }
      
      setCurrentParticipant(newParticipant[0]);
      setShowProfileSetup(false);
      
      toast({
        title: "Welcome!",
        description: `You've joined as ${profile.displayName}`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error creating participant:", error);
      toast({
        title: "Error",
        description: "Failed to join session. Please try again.",
        variant: "destructive",
      });
    }
  }, [sessionId, toast]);

  // Setup the optimisticUpdateTask function to also update assignee information
  const optimisticUpdateTask = useCallback((taskId: string, updateData: Partial<SessionTask>) => {
    setSessionTasks(prevTasks => {
      // Get the current participant's info if this is an assignment
      let assigneeInfo = undefined;
      if (updateData.status === 'doing' && currentParticipant) {
        if (updateData.assigned_to_temp_user === currentParticipant.temp_user_id ||
            updateData.assigned_to === currentParticipant.user_id) {
          // This task is being assigned to the current user
          assigneeInfo = {
            display_name: currentParticipant.display_name,
            avatar_url: currentParticipant.avatar_url
          };
        }
      }
      
      const updatedTasks = prevTasks.map(task => {
        if (task.id === taskId) {
          // If we're assigning the task and have assignee info, include it
          if (assigneeInfo && (updateData.status === 'doing')) {
            return { 
              ...task, 
              ...updateData,
              assignee: assigneeInfo
            };
          }
          return { ...task, ...updateData };
        }
        return task;
      });
      return updatedTasks;
    });
  }, [currentParticipant]);

  // Memoize the grouped tasks to avoid re-sorting on every render
  const { todoTasks, doingTasks, doneTasks, myTasks } = useMemo(() => {
    // Make sure we have valid sessionTasks
    if (!sessionTasks || !Array.isArray(sessionTasks)) {
      return { todoTasks: [], doingTasks: [], doneTasks: [], myTasks: [] };
    }
    
    const todo = sessionTasks
      .filter(task => task && task.status === "todo" && task.task)
      .sort((a, b) => {
        // Null checks for task property
        if (!a.task || !b.task) return 0;
        
        // Sort "Do First" items to the top
        if (a.task.priority === 'do_first' && b.task.priority !== 'do_first') return -1;
        if (a.task.priority !== 'do_first' && b.task.priority === 'do_first') return 1;
        // Sort "Do Last" items to the bottom
        if (a.task.priority === 'do_last' && b.task.priority !== 'do_last') return 1;
        if (a.task.priority !== 'do_last' && b.task.priority === 'do_last') return -1;
        // Default sort by title if priorities are the same
        return (a.task.title || '').localeCompare(b.task.title || '');
      });

    const doing = sessionTasks
      .filter(task => task && task.status === "doing" && task.task)
      .sort((a, b) => {
        // Null checks for task property
        if (!a.task || !b.task) return 0;
        
        // Similar priority sorting
        if (a.task.priority === 'do_first' && b.task.priority !== 'do_first') return -1;
        if (a.task.priority !== 'do_first' && b.task.priority === 'do_first') return 1;
        if (a.task.priority === 'do_last' && b.task.priority !== 'do_last') return 1;
        if (a.task.priority !== 'do_last' && b.task.priority === 'do_last') return -1;
        return (a.task.title || '').localeCompare(b.task.title || '');
      });

    const done = sessionTasks
      .filter(task => task && task.status === "done" && task.task)
      .sort((a, b) => {
        // Null checks for task property  
        if (!a.task || !b.task) return 0;
        
        return (a.completed_at && b.completed_at) 
          ? new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime() 
          : (a.task.title || '').localeCompare(b.task.title || '');
      });

    const my = currentParticipant?.temp_user_id
      ? sessionTasks.filter(task => task && task.assigned_to_temp_user === currentParticipant.temp_user_id && task.task)
      : [];

    return { todoTasks: todo, doingTasks: doing, doneTasks: done, myTasks: my };
  }, [sessionTasks, currentParticipant]);

  // In case task gets deleted
  const selectedTaskFull = useMemo(() => {
    if (!selectedTask) return null;
    
    // Try to find the task in the current sessionTasks
    const foundTask = sessionTasks.find(t => t && t.id === selectedTask.id);
    
    // If found and has a valid task property, return it, otherwise fall back to selectedTask
    return (foundTask && foundTask.task) ? foundTask : selectedTask;
  }, [selectedTask, sessionTasks]);

  if (isLoading) {
    return (
      <AnonymousTasksLayout sessionId={sessionId} isAnonymous={true}>
        <div className="space-y-6">
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
      </AnonymousTasksLayout>
    );
  }

  if (!session) {
    return (
      <AnonymousTasksLayout sessionId={sessionId} isAnonymous={true}>
        <div className="flex flex-col items-center justify-center py-12">
          <h1 className="text-2xl font-bold mb-2">Session Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The cleaning session you're looking for doesn't exist or has expired.
          </p>
        </div>
      </AnonymousTasksLayout>
    );
  }

  // QR code URL for sharing
  const qrCodeUrl = `${serverUrl}/public/tasks/${sessionId}`;

  return (
    <AnonymousTasksLayout sessionId={sessionId} isAnonymous={!currentParticipant?.is_authenticated}>
      <div className="flex flex-col space-y-6">
        {/* Session header with QR code */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
          <div>
            <h1 className="text-2xl font-bold">{session?.session_name}</h1>
            <p className="text-muted-foreground">
              {new Date(session?.session_date || "").toLocaleDateString()}
            </p>
            {currentParticipant && (
              <p className="text-sm text-muted-foreground mt-1">
                Participating as <span className="font-medium">{currentParticipant.display_name}</span>
              </p>
            )}
          </div>
          
          <div className="flex items-center flex-col">
            <SessionQRCode 
              url={qrCodeUrl}
              showSpotlight={true}
            />
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Invite others to join
            </p>
          </div>
        </div>
        
        {/* Guest Features Section */}
        {currentParticipant && !currentParticipant.is_authenticated && (
          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <h2 className="text-sm font-medium mb-2">Guest Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center">
                <span className="bg-green-100 text-green-800 rounded-full p-1 mr-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <span>View and claim tasks</span>
              </div>
              
              <div className="flex items-center">
                <GuestLimitationsTooltip sessionId={sessionId} feature="calendar">
                  <span className="bg-red-100 text-red-800 rounded-full p-1 mr-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </span>
                  <span className="text-muted-foreground">Cleaning calendar</span>
                </GuestLimitationsTooltip>
              </div>
              
              <div className="flex items-center">
                <GuestLimitationsTooltip sessionId={sessionId} feature="leaderboard">
                  <span className="bg-red-100 text-red-800 rounded-full p-1 mr-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </span>
                  <span className="text-muted-foreground">Earn points</span>
                </GuestLimitationsTooltip>
              </div>
            </div>
          </div>
        )}
        
        {/* My Tasks Section */}
        {currentParticipant && myTasks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">My Assigned Tasks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onClick={() => handleTaskClick(task.id)} 
                />
              ))}
            </div>
          </div>
        )}
        
        {/* All Tasks Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* To Do Tasks */}
          <div>
            <h2 className="font-semibold mb-4 flex items-center">
              To Do <span className="ml-2 text-xs px-2 py-1 rounded-full bg-muted">{todoTasks.length}</span>
            </h2>
            <div className="space-y-4">
              {todoTasks.map((task, index) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onClick={() => handleTaskClick(task.id)}
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
          
          {/* Doing Tasks */}
          <div>
            <h2 className="font-semibold mb-4 flex items-center">
              Doing <span className="ml-2 text-xs px-2 py-1 rounded-full bg-muted">{doingTasks.length}</span>
            </h2>
            <div className="space-y-4">
              {doingTasks.map((task, index) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onClick={() => handleTaskClick(task.id)}
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
          
          {/* Done Tasks */}
          <div>
            <h2 className="font-semibold mb-4 flex items-center">
              Done <span className="ml-2 text-xs px-2 py-1 rounded-full bg-muted">{doneTasks.length}</span>
            </h2>
            <div className="space-y-4">
              {doneTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onClick={() => handleTaskClick(task.id)}
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
      </div>
      
      {/* Task Detail Modal */}
      {selectedTaskFull && (
        <TaskDetail
          sessionTask={selectedTaskFull}
          isOpen={showTaskDetail}
          onClose={handleTaskDetailClose}
          currentUserId={null}
          currentParticipant={currentParticipant}
          isAuthenticated={false}
          optimisticUpdateTask={optimisticUpdateTask}
        />
      )}
      
      {/* Onboarding Modal */}
      <AnonymousOnboardingModal 
        isOpen={showOnboarding}
        sessionId={sessionId}
        onClose={() => setShowOnboarding(false)}
        onContinueAsGuest={handleContinueAsGuest}
      />
      
      {/* Profile Setup Modal */}
      <GuestProfileSetup
        isOpen={showProfileSetup}
        sessionId={sessionId}
        onClose={() => setShowProfileSetup(false)}
        onProfileComplete={handleProfileComplete}
      />
    </AnonymousTasksLayout>
  );
} 