"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, Loader2, QrCode, Share2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

interface Task {
  id: string;
  task_id: string;
  session_id: string;
  status: string;
  assigned_to: string | null;
  assigned_to_temp_user: string | null;
  assigned_at: string | null;
  completed_at: string | null;
  points_awarded: number | null;
  // Include task details
  task: {
    title: string;
    subtitle: string | null;
    instructions: string | null;
    equipment: string | null;
    color: string | null;
    priority: string | null;
    points: number | null;
  };
}

interface Session {
  id: string;
  ward_branch_id: string;
  schedule_id: string | null;
  session_name: string;
  session_date: string;
  public_access_code: string;
  status: string;
  completed_at: string | null;
}

export default function SessionDetailsPage() {
  const params = useParams();
  const sessionId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  useEffect(() => {
    loadSessionDetails();
  }, [sessionId]);

  const loadSessionDetails = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const supabase = createClient();
      
      // Load session details
      const { data: sessionData, error: sessionError } = await supabase
        .from("cleaning_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      
      if (sessionError) throw sessionError;
      setSession(sessionData);
      
      // Load session tasks with task details
      const { data: tasksData, error: tasksError } = await supabase
        .from("cleaning_session_tasks")
        .select(`
          *,
          task:ward_tasks(
            title, subtitle, instructions, equipment, color, priority, points
          )
        `)
        .eq("session_id", sessionId)
        .order("status", { ascending: false });
      
      if (tasksError) throw tasksError;
      setTasks(tasksData);
      
    } catch (error: any) {
      console.error("Error loading session details:", error);
      setErrorMessage(`Failed to load session details: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-blue-100 text-blue-800";
      case "doing":
        return "bg-yellow-100 text-yellow-800";
      case "done":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getPublicShareUrl = () => {
    if (!session) return "";
    return `${window.location.origin}/tasks/public/${session.public_access_code}`;
  };

  const handleShare = async () => {
    const url = getPublicShareUrl();
    
    // Use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ward Cleaning: ${session?.session_name}`,
          text: "Join our ward cleaning session!",
          url,
        });
      } catch (error) {
        console.log('Error sharing', error);
        // Fall back to clipboard
        copyToClipboard(url);
      }
    } else {
      // Fallback for browsers that don't support share API
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => alert("Link copied to clipboard!"))
      .catch((error) => console.error("Error copying to clipboard:", error));
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="space-y-4">
        <Link href="/protected/tasks">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>
        </Link>
        <div className="p-4 border border-destructive/50 rounded-md text-destructive">
          {errorMessage}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <Link href="/protected/tasks">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>
        </Link>
        <div className="p-4 border border-muted rounded-md">
          Session not found or you don't have access to it.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link href="/protected/tasks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tasks
            </Button>
          </Link>
          <h1 className="text-2xl font-bold mt-2">{session.session_name}</h1>
          <p className="text-muted-foreground">
            {formatDate(session.session_date)}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setIsQrModalOpen(true)}
          >
            <QrCode className="mr-2 h-4 w-4" />
            QR Code
          </Button>
          <Button onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className={`border rounded-lg p-4 ${
              task.status === "done" 
                ? "opacity-75" 
                : "hover:border-primary"
            } transition-all`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{task.task.title}</h3>
              <Badge 
                className={getStatusColor(task.status)}
                variant="outline"
              >
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </Badge>
            </div>
            
            {task.task.subtitle && (
              <p className="text-sm text-muted-foreground mb-2">{task.task.subtitle}</p>
            )}
            
            {task.status === "doing" && task.assigned_at && (
              <div className="text-xs text-muted-foreground mt-2">
                Started: {new Date(task.assigned_at).toLocaleTimeString()}
              </div>
            )}
            
            {task.status === "done" && task.completed_at && (
              <div className="text-xs text-muted-foreground mt-2">
                Completed: {new Date(task.completed_at).toLocaleTimeString()}
              </div>
            )}
            
            {task.points_awarded && (
              <div className="mt-2 text-sm font-medium">
                Points: {task.points_awarded}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* QR Code Modal */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share via QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6">
            <QRCodeSVG 
              value={getPublicShareUrl()} 
              size={200}
              includeMargin={true}
              className="mb-4"
            />
            <p className="text-sm text-center text-muted-foreground">
              Scan this QR code to join the cleaning session
            </p>
            <p className="mt-2 text-xs text-center font-mono bg-muted p-2 rounded w-full">
              Access Code: {session.public_access_code}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 