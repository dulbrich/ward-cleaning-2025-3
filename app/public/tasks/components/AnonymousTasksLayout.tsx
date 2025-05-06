"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { FC, ReactNode } from "react";
import ScrollToTopButton from "./ScrollToTopButton";

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

  // Helper function to create sign up URL with session context
  const getSignUpUrl = () => {
    // Get the temp user ID from localStorage if exists
    const tempUserId = localStorage.getItem(`tempUserId_${sessionId}`);
    
    // Build URL parameters
    const params = new URLSearchParams();
    params.append('returnUrl', `/tasks?sessionId=${sessionId}`);
    params.append('sessionId', sessionId);
    
    // Only append tempUserId if it exists
    if (tempUserId) {
      params.append('tempUserId', tempUserId);
    }
    
    return `/sign-up?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header with guest mode indicator */}
      <header className="border-b py-2 px-4 bg-white">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="font-bold text-xl">Ward Cleaning</h1>
            {isAnonymous && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 cursor-help">
                      Guest Mode
                      <HelpCircle className="h-3 w-3" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>You're participating as a guest. Create an account to access features like notifications, leaderboard, and save your profile.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div>
            {isAnonymous && (
              <Button 
                onClick={() => router.push(getSignUpUrl())}
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
              onClick={() => router.push(getSignUpUrl())}
              size="lg"
              className="shadow-lg bg-primary/90 hover:bg-primary transition-all"
            >
              <User className="mr-2 h-4 w-4" />
              Sign Up for Benefits
            </Button>
            <p className="text-xs text-right text-muted-foreground pr-1">
              Share the QR code to invite others
            </p>
          </div>
        </div>
      )}

      {/* Scroll to top button */}
      <ScrollToTopButton />
    </div>
  );
};

export default AnonymousTasksLayout; 