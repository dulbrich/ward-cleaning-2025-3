"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import AnonymousOnboardingModal from "../components/AnonymousOnboardingModal";
import AnonymousTasksLayout from "../components/AnonymousTasksLayout";
import GuestProfileSetup from "../components/GuestProfileSetup";
import SessionQRCode from "../components/SessionQRCode";

// Import existing TaskDetail and other components from the main app
import TaskCard from "@/app/app/tasks/components/TaskCard";
import TaskDetail from "@/app/app/tasks/components/TaskDetail";

// Reuse types from main app tasks
import type {
    CleaningSession,
    SessionParticipant,
    SessionTask,
} from "@/app/app/tasks/types";

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
        setSession(sessionData);
        
        // Fetch session tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from("cleaning_session_tasks")
          .select(`
            *,
            task:ward_tasks(*)
          `)
          .eq("session_id", sessionId);
          
        if (tasksError) throw tasksError;
        
        // Fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from("session_participants")
          .select("*")
          .eq("session_id", sessionId);
          
        if (participantsError) throw participantsError;
        setParticipants(participantsData || []);
        
        // Enhance tasks with assignee information
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
        
        // Check for returning user
        if (isReturningUser) {
          const tempUserId = localStorage.getItem(`tempUserId_${sessionId}`);
          const { data: existingParticipant } = await supabase
            .from("session_participants")
            .select("*")
            .eq("session_id", sessionId)
            .eq("temp_user_id", tempUserId)
            .maybeSingle();
            
          if (existingParticipant) {
            // Update last active time
            await supabase
              .from("session_participants")
              .update({ last_active_at: new Date().toISOString() })
              .eq("id", existingParticipant.id);
              
            setCurrentParticipant(existingParticipant);
            
            toast({
              title: "Welcome back!",
              description: `You're back as ${existingParticipant.display_name}`,
              duration: 3000,
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

  // Handle task detail view
  const handleTaskClick = useCallback((task: SessionTask) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
    
    // Record that user is viewing this task
    if (currentParticipant) {
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
        .then(({ error }) => {
          if (error) console.error("Error recording task view:", error);
        });
    }
  }, [supabase, currentParticipant]);

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
        .then(({ error }) => {
          if (error) console.error("Error removing task view:", error);
        });
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
      // Create participant record in the database
      const { data: newParticipant, error } = await supabase
        .from("session_participants")
        .insert({
          session_id: sessionId,
          temp_user_id: profile.tempUserId,
          display_name: profile.displayName,
          avatar_url: profile.avatarUrl,
          is_authenticated: false,
          last_active_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      setCurrentParticipant(newParticipant);
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
  }, [supabase, sessionId, toast]);

  // Optimistically update task status
  const optimisticUpdateTask = useCallback((taskId: string, updateData: Partial<SessionTask>) => {
    setSessionTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updateData } : task
      );
      return updatedTasks;
    });
  }, []);

  // Group tasks by status (reusing logic from original tasks page)
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
      // Similar priority sorting
      if (a.task.priority === 'do_first' && b.task.priority !== 'do_first') return -1;
      if (a.task.priority !== 'do_first' && b.task.priority === 'do_first') return 1;
      if (a.task.priority === 'do_last' && b.task.priority !== 'do_last') return 1;
      if (a.task.priority !== 'do_last' && b.task.priority === 'do_last') return -1;
      return a.task.title.localeCompare(b.task.title);
    });

  const doneTasks = sessionTasks
    .filter(task => task.status === "done")
    .sort((a, b) => (a.completed_at && b.completed_at) 
      ? new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime() 
      : a.task.title.localeCompare(b.task.title)
    );

  const myTasks = sessionTasks.filter(task => {
    if (currentParticipant?.temp_user_id) {
      return task.assigned_to_temp_user === currentParticipant.temp_user_id;
    }
    return false;
  });

  // In case task gets deleted
  const selectedTaskFull = selectedTask
    ? sessionTasks.find(t => t.id === selectedTask.id) || selectedTask
    : null;

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
        
        {/* My Tasks Section */}
        {currentParticipant && myTasks.length > 0 && (
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
                  onClick={() => handleTaskClick(task)}
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