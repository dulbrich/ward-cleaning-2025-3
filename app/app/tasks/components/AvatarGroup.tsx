"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import React, { useEffect, useState } from "react";

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
  
  // Handle all URLs explicitly and log them
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
  
  console.log(`Avatar URL processed: "${url}" → "${processedUrl}"`);
  return processedUrl;
};

export const AvatarGroup: React.FC<AvatarGroupProps> = ({ 
  viewers, 
  limit = 5 
}) => {
  // Track which avatars failed to load
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  // Track valid images for debugging
  const [validImages, setValidImages] = useState<Record<number, boolean>>({});
  const visibleViewers = viewers.slice(0, limit);
  const hiddenCount = Math.max(0, viewers.length - limit);
  
  // Preload images and check if they can be loaded
  useEffect(() => {
    const newValidImages: Record<number, boolean> = {};
    
    visibleViewers.forEach((viewer, index) => {
      if (viewer.imageSrc) {
        const url = processAvatarUrl(viewer.imageSrc);
        console.log(`Testing avatar for ${viewer.name}: ${url}`);
        
        const img = new Image();
        img.onload = () => {
          console.log(`✅ Avatar image ${index} loaded successfully: ${url}`);
          newValidImages[index] = true;
          setValidImages(prev => ({...prev, [index]: true}));
        };
        img.onerror = () => {
          console.error(`❌ Avatar image ${index} failed to preload: ${url}`);
          setFailedImages(prev => ({...prev, [index]: true}));
        };
        img.src = url;
      }
    });
    
    return () => {
      // Clean up image objects
      visibleViewers.forEach((viewer, index) => {
        if (viewer.imageSrc) {
          const img = new Image();
          img.onload = null;
          img.onerror = null;
        }
      });
    };
  }, [visibleViewers]);

  // Clear failed images when viewers change
  useEffect(() => {
    setFailedImages({});
    setValidImages({});
  }, [viewers]);

  // Debug avatars on mount
  useEffect(() => {
    console.log("AvatarGroup Viewers:", viewers.map(v => ({
      name: v.name,
      hasImage: !!v.imageSrc,
      rawUrl: v.imageSrc,
      processedUrl: v.imageSrc ? processAvatarUrl(v.imageSrc) : 'none'
    })));
  }, [viewers]);
  
  // Handle image loading error in the component
  const handleImageError = (index: number, url: string) => {
    console.error(`Avatar image ${index} failed to load in component: ${url}`);
    setFailedImages(prev => ({...prev, [index]: true}));
  };
  
  return (
    <div className="flex -space-x-2">
      <TooltipProvider>
        {visibleViewers.map((viewer, i) => {
          const imageUrl = viewer.imageSrc ? processAvatarUrl(viewer.imageSrc) : '';
          const showImage = imageUrl && !failedImages[i];
          const isValidImage = validImages[i];
          
          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div>
                  <Avatar className={`h-8 w-8 border-2 ${isValidImage ? 'border-green-300' : 'border-background'}`}>
                    {showImage && (
                      <AvatarImage 
                        src={imageUrl}
                        alt={viewer.name}
                        className="object-cover"
                        onError={() => handleImageError(i, imageUrl)}
                      />
                    )}
                    <AvatarFallback>
                      {viewer.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <div>
                  <div>{viewer.name}</div>
                  {imageUrl && (
                    <div className="text-xs text-muted-foreground">
                      {isValidImage ? (
                        <span className="text-green-600">✅ Avatar loaded</span>
                      ) : failedImages[i] ? (
                        <span className="text-red-500">❌ Avatar failed to load</span>
                      ) : (
                        <span className="text-amber-500">⏳ Loading avatar...</span>
                      )}
                      <div className="text-[10px] text-gray-500 break-all mt-1">
                        {imageUrl}
                      </div>
                    </div>
                  )}
                </div>
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