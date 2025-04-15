"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import React from "react";

interface User {
  display_name: string;
  avatar_url?: string;
}

interface AvatarStackProps {
  users: User[];
  assignee?: User;
  maxAvatars?: number;
  className?: string;
}

// Function to get initials from a name
const getInitials = (name: string): string => {
  if (!name) return "U";
  
  const parts = name.split(" ");
  if (parts.length === 1) return name.substring(0, 2).toUpperCase();
  
  return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
};

export const AvatarStack: React.FC<AvatarStackProps> = ({ 
  users, 
  assignee,
  maxAvatars = 3,
  className 
}) => {
  // Filter out the assignee from the users list if present to avoid duplicates
  const viewers = assignee 
    ? users.filter(user => user.display_name !== assignee.display_name) 
    : users;
  
  // Limit the number of viewers to display
  const displayedViewers = viewers.slice(0, maxAvatars);
  const remainingCount = viewers.length - maxAvatars;
  
  return (
    <div className={cn("flex items-center", className)}>
      <TooltipProvider>
        {/* Assignee avatar (if provided) */}
        {assignee && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-6 w-6 border-2 border-background">
                <AvatarImage src={assignee.avatar_url} />
                <AvatarFallback className="text-xs">
                  {getInitials(assignee.display_name)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{assignee.display_name} (Assignee)</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Viewer avatars */}
        <div className="flex -space-x-2">
          {displayedViewers.map((user, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <Avatar 
                  className={cn(
                    "h-6 w-6 border-2 border-background", 
                    i > 0 && "-ml-2"
                  )}
                >
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {getInitials(user.display_name)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{user.display_name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {/* Show count of remaining viewers if any */}
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                  +{remainingCount}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{remainingCount} more {remainingCount === 1 ? 'viewer' : 'viewers'}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
};

export default AvatarStack; 