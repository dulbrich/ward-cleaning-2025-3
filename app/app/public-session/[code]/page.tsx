"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PublicSessionPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const findSession = async () => {
      setLoading(true);
      
      try {
        // Find session by public access code
        const { data, error } = await supabase
          .from("cleaning_sessions")
          .select("id, session_name, status")
          .eq("public_access_code", params.code)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          setError("Cleaning session not found");
          return;
        }
        
        if (data.status !== "active") {
          setError("This cleaning session is no longer active");
          return;
        }
        
        setSessionId(data.id);
        
        // Redirect to the tasks page with the session ID
        router.push(`/tasks?sessionId=${data.id}`);
      } catch (error) {
        console.error("Error finding session:", error);
        setError("Unable to find the cleaning session. The link may be invalid or expired.");
      } finally {
        setLoading(false);
      }
    };
    
    findSession();
  }, [supabase, params.code, router]);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-4 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-8" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <h1 className="text-2xl font-bold mb-4">Session Not Found</h1>
        <p className="text-muted-foreground mb-2 text-center max-w-md">{error}</p>
        <p className="text-muted-foreground mb-8 text-center max-w-md">
          Please check that you have the correct link or contact the session organizer.
        </p>
        <Button onClick={() => router.push("/")}>
          Return Home
        </Button>
      </div>
    );
  }
  
  // This should not be visible as we're redirecting in the useEffect
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <p>Redirecting to cleaning session...</p>
    </div>
  );
} 