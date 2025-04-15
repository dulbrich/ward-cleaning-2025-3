"use client";

import { CreateSessionModal } from "@/components/tasks/CreateSessionModal";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface WardBranch {
  id: string;
  name: string;
}

export default function TasksPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [wardBranches, setWardBranches] = useState<WardBranch[]>([]);
  const [selectedWard, setSelectedWard] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    loadWardBranches();
  }, []);

  useEffect(() => {
    if (selectedWard) {
      loadSessions(selectedWard);
    }
  }, [selectedWard]);

  const loadWardBranches = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("ward_branches")
        .select("id, name");

      if (error) throw error;

      if (data && data.length > 0) {
        setWardBranches(data);
        setSelectedWard(data[0].id);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error loading ward branches:", error);
      setIsLoading(false);
    }
  };

  const loadSessions = async (wardId: string) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("cleaning_sessions")
        .select("*")
        .eq("ward_branch_id", wardId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSessions(data || []);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionCreated = (sessionId: string) => {
    // Reload sessions
    if (selectedWard) {
      loadSessions(selectedWard);
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

  if (wardBranches.length === 0 && !isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <div className="p-4 border border-muted rounded-md">
          <p className="mb-2">You need to set up a ward before you can create cleaning sessions.</p>
          <Button asChild>
            <Link href="/protected/settings">Set Up Ward</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Cleaning Session
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-6 text-center border border-dashed rounded-lg">
          <h3 className="font-semibold mb-2">No cleaning sessions yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first cleaning session.
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Cleaning Session
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="border rounded-lg p-4 hover:border-primary transition-colors"
            >
              <h3 className="font-semibold text-lg truncate">{session.session_name}</h3>
              <p className="text-muted-foreground mb-4">{formatDate(session.session_date)}</p>
              <div className="flex justify-between items-center">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    session.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {session.status === "completed" ? "Completed" : "Active"}
                </span>
                <Button variant="outline" asChild>
                  <Link href={`/protected/tasks/${session.id}`}>View Tasks</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedWard && (
        <CreateSessionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          wardBranchId={selectedWard}
          onSessionCreated={handleSessionCreated}
        />
      )}
    </div>
  );
} 