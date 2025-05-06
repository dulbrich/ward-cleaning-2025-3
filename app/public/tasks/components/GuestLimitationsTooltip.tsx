import { Button } from "@/components/ui/button";
import { InfoIcon, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { FC } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../../../../components/ui/tooltip";

interface GuestLimitationsTooltipProps {
  sessionId: string;
  feature: "leaderboard" | "notifications" | "calendar" | "general";
  children: React.ReactNode;
}

const featureDescriptions = {
  leaderboard: "Earn points and compete with others on the leaderboard",
  notifications: "Get notifications about upcoming cleaning sessions",
  calendar: "View and manage the full cleaning calendar",
  general: "Access all features and permanently save your profile",
};

const GuestLimitationsTooltip: FC<GuestLimitationsTooltipProps> = ({
  sessionId,
  feature,
  children,
}) => {
  const router = useRouter();
  
  const handleSignUp = () => {
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
    
    router.push(`/sign-up?${params.toString()}`);
  };
  
  return (
    <div className="inline-flex items-center">
      <span>{children}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon className="h-3.5 w-3.5 ml-1 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="flex flex-col space-y-2">
              <p className="text-sm">
                This feature requires an account. Sign up to {featureDescriptions[feature]}.
              </p>
              <Button 
                onClick={handleSignUp} 
                size="sm" 
                className="mt-1 w-full"
              >
                <User className="h-3 w-3 mr-1" />
                Create Account
              </Button>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default GuestLimitationsTooltip; 