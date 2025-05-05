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
import { FC } from "react";

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

  const handleSignUp = () => {
    router.push(`/login?returnUrl=${encodeURIComponent(`/tasks?sessionId=${sessionId}`)}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to Ward Cleaning</DialogTitle>
          <DialogDescription>
            Choose how you'd like to participate in today's cleaning session
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex flex-col space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Guest Mode</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                    <span>View and claim tasks</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                    <span>Track progress</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                    <span>Collaborate with others</span>
                  </li>
                  <li className="flex items-center">
                    <XCircle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-muted-foreground">No cleaning calendar</span>
                  </li>
                  <li className="flex items-center">
                    <XCircle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-muted-foreground">No notifications</span>
                  </li>
                  <li className="flex items-center">
                    <XCircle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-muted-foreground">No leaderboard</span>
                  </li>
                  <li className="flex items-center">
                    <XCircle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-muted-foreground">Re-enter info each time</span>
                  </li>
                </ul>
              </div>

              <div className="bg-primary/5 border-primary/20 border p-4 rounded-lg">
                <h3 className="font-medium mb-2">Signed-Up Member</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                    <span>View and claim tasks</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                    <span>Track progress</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                    <span>Collaborate with others</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                    <span>Cleaning calendar access</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                    <span>Customizable notifications</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                    <span>Earn points and compete</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                    <span>Persistent profile</span>
                  </li>
                </ul>
              </div>
            </div>

            <Button
              variant="default"
              className="w-full mb-2"
              onClick={handleSignUp}
            >
              <User className="mr-2 h-4 w-4" />
              Sign Up
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
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