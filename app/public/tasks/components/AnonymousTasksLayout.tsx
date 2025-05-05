"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import { FC, ReactNode } from "react";

interface AnonymousTasksLayoutProps {
  children: ReactNode;
  sessionId: string;
  isAnonymous: boolean;
}

const AnonymousTasksLayout: FC<AnonymousTasksLayoutProps> = ({
  children,
  sessionId,
  isAnonymous
}) => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header with guest mode indicator */}
      <header className="border-b py-2 px-4 bg-white">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="font-bold text-xl">Ward Cleaning</h1>
            {isAnonymous && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Guest Mode
              </Badge>
            )}
          </div>
          <div>
            {isAnonymous && (
              <Button 
                onClick={() => router.push(`/login?returnUrl=${encodeURIComponent(`/tasks?sessionId=${sessionId}`)}`)}
                className="shadow-sm"
                variant="default"
              >
                <User className="mr-2 h-4 w-4" />
                Sign Up
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 max-w-screen-xl mx-auto py-4">
        {children}
      </main>

      {/* Fixed sign up button at bottom for easy access */}
      {isAnonymous && (
        <div className="fixed bottom-6 right-6">
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => router.push(`/login?returnUrl=${encodeURIComponent(`/tasks?sessionId=${sessionId}`)}`)}
              size="lg"
              className="shadow-lg"
            >
              <User className="mr-2 h-4 w-4" />
              Sign Up for Benefits
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnonymousTasksLayout; 