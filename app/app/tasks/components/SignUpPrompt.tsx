"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Award, CalendarClock, Trophy, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

interface SignUpPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

const SignUpPrompt: React.FC<SignUpPromptProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  
  const handleSignUp = () => {
    router.push("/login?returnUrl=" + encodeURIComponent(window.location.pathname + window.location.search));
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-md max-h-[90vh] overflow-y-auto w-[95vw]"
        style={{ position: 'fixed', top: '5vh', transform: 'translateY(0) translateX(-50%)' }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">Join Our Cleaning Team!</DialogTitle>
          <DialogDescription>
            Sign up to unlock additional features and benefits.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Trophy className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-medium mb-1">Earn Points & Join Leaderboard</h3>
                <p className="text-sm text-muted-foreground">
                  Compete with others and earn recognition for your service.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CalendarClock className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium mb-1">Get Cleaning Reminders</h3>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about upcoming ward cleaning events.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h3 className="font-medium mb-1">Access Ward Cleaning Calendar</h3>
                <p className="text-sm text-muted-foreground">
                  View all scheduled cleanings and plan your participation.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <h3 className="font-medium mb-1">Unlock Special Achievements</h3>
                <p className="text-sm text-muted-foreground">
                  Earn badges and recognition for your consistent service.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex sm:justify-between gap-4">
          <Button variant="outline" onClick={onClose}>Continue as Guest</Button>
          <Button onClick={handleSignUp}>Sign Up Now</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignUpPrompt; 