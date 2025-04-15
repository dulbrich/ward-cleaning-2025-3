"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import React from "react";

interface Viewer {
  name: string;
  imageSrc?: string;
}

interface AvatarGroupProps {
  viewers: Viewer[];
  limit?: number;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({ 
  viewers, 
  limit = 5 
}) => {
  const visibleViewers = viewers.slice(0, limit);
  const hiddenCount = Math.max(0, viewers.length - limit);
  
  return (
    <div className="flex -space-x-2">
      <TooltipProvider>
        {visibleViewers.map((viewer, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <div>
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={viewer.imageSrc} />
                  <AvatarFallback>
                    {viewer.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              {viewer.name}
            </TooltipContent>
          </Tooltip>
        ))}
        
        {hiddenCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground border-2 border-background">
                +{hiddenCount}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {viewers.slice(limit).map(viewer => viewer.name).join(", ")}
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}; 