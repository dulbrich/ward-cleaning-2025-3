"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, User, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";

interface AnonymousOnboardingModalProps {
  isOpen: boolean;
  sessionId: string;
  onClose: () => void;
  onContinueAsGuest: () => void;
}

const AnonymousOnboardingModal: FC<AnonymousOnboardingModalProps> = ({
  isOpen,
  sessionId,
  onClose,
  onContinueAsGuest,
}) => {
  const router = useRouter();
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  
  // Get the temp user ID from localStorage if exists
  useEffect(() => {
    if (sessionId) {
      const storedTempUserId = localStorage.getItem(`tempUserId_${sessionId}`);
      setTempUserId(storedTempUserId);
    }
  }, [sessionId]);

  const handleSignUp = () => {
    // Modify to include session ID and temp user ID in the URL parameters
    const params = new URLSearchParams();
    params.append('returnUrl', `/tasks?sessionId=${sessionId}`);
    params.append('sessionId', sessionId);
    
    // Only append tempUserId if it exists
    if (tempUserId) {
      params.append('tempUserId', tempUserId);
    }
    
    router.push(`/sign-up?${params.toString()}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Welcome to Ward Cleaning</DialogTitle>
          <DialogDescription className="text-base">
            Choose how you'd like to participate in today's cleaning session
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="flex flex-col space-y-5">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-muted p-5 rounded-lg">
                <h3 className="font-medium mb-3">Guest Mode</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                    <span>View and claim tasks</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                    <span>Track progress</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                    <span>Collaborate with others</span>
                  </li>
                  <li className="flex items-center">
                    <XCircle className="h-4 w-4 text-red-600 mr-3 flex-shrink-0" />
                    <span className="text-muted-foreground">No cleaning calendar</span>
                  </li>
                  <li className="flex items-center">
                    <XCircle className="h-4 w-4 text-red-600 mr-3 flex-shrink-0" />
                    <span className="text-muted-foreground">No notifications</span>
                  </li>
                  <li className="flex items-center">
                    <XCircle className="h-4 w-4 text-red-600 mr-3 flex-shrink-0" />
                    <span className="text-muted-foreground">No leaderboard</span>
                  </li>
                  <li className="flex items-center">
                    <XCircle className="h-4 w-4 text-red-600 mr-3 flex-shrink-0" />
                    <span className="text-muted-foreground">Re-enter info each time</span>
                  </li>
                </ul>
              </div>

              <div className="bg-primary/5 border-primary/20 border p-5 rounded-lg">
                <h3 className="font-medium mb-3">Signed-Up Member</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                    <span>View and claim tasks</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                    <span>Track progress</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                    <span>Collaborate with others</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                    <span>Cleaning calendar access</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                    <span>Customizable notifications</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                    <span>Earn points and compete</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                    <span>Persistent profile</span>
                  </li>
                </ul>
              </div>
            </div>

            <Button
              variant="default"
              className="w-full mb-3 py-6 text-base"
              onClick={handleSignUp}
            >
              <User className="mr-2 h-5 w-5" />
              Sign Up
            </Button>
            
            <Button
              variant="outline"
              className="w-full py-6 text-base"
              onClick={onContinueAsGuest}
            >
              Continue as Guest
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnonymousOnboardingModal; 