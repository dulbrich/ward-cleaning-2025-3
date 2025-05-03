"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import React, { useState } from "react";

interface Viewer {
  name: string;
  imageSrc?: string;
}

interface AvatarGroupProps {
  viewers: Viewer[];
  limit?: number;
}

// Helper function to process avatar URLs
const processAvatarUrl = (url?: string): string => {
  if (!url) return '';
  
  // Handle all URLs explicitly
  let processedUrl = url;
  
  if (url.startsWith('http')) {
    // Already a full URL
    processedUrl = url;
  } else if (url.startsWith('/')) {
    // A site-relative path
    processedUrl = url;
  } else {
    // Assume it's a relative path to avatars
    processedUrl = `/images/avatars/${url}`;
  }
  
  return processedUrl;
};

export const AvatarGroup: React.FC<AvatarGroupProps> = ({ 
  viewers, 
  limit = 5 
}) => {
  // Track which avatars failed to load
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const visibleViewers = viewers.slice(0, limit);
  const hiddenCount = Math.max(0, viewers.length - limit);
  
  // Handle image loading error in the component
  const handleImageError = (index: number) => {
    setFailedImages(prev => ({...prev, [index]: true}));
  };
  
  return (
    <div className="flex -space-x-2">
      <TooltipProvider>
        {visibleViewers.map((viewer, i) => {
          const imageUrl = viewer.imageSrc ? processAvatarUrl(viewer.imageSrc) : '';
          const showImage = imageUrl && !failedImages[i];
          
          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div>
                  <Avatar className="h-8 w-8 border-2 border-background">
                    {showImage && (
                      <AvatarImage 
                        src={imageUrl}
                        alt={viewer.name}
                        className="object-cover"
                        onError={() => handleImageError(i)}
                      />
                    )}
                    <AvatarFallback>
                      {viewer.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <div>{viewer.name}</div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        
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