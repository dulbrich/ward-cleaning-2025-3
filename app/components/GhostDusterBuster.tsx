"use client";

import { useEffect, useState } from 'react';

interface GhostDusterBusterProps {
  title: string;
  instructions: string;
}

export function GhostDusterBuster({ title, instructions }: GhostDusterBusterProps) {
  const [showGhost, setShowGhost] = useState(false);
  
  useEffect(() => {
    // Check if the task is a vacuuming task
    const isVacuumingTask = 
      title.toLowerCase().includes('vacuum') || 
      title.toLowerCase().includes('vacuuming') ||
      instructions.toLowerCase().includes('vacuum') || 
      instructions.toLowerCase().includes('vacuuming');
    
    setShowGhost(isVacuumingTask);
  }, [title, instructions]);
  
  if (!showGhost) return null;
  
  return (
    <div className="mt-2 p-2 bg-purple-100 rounded-md border border-purple-200 flex items-center">
      <div className="h-8 w-8 bg-purple-400 rounded-full flex items-center justify-center mr-2">
        <span className="text-white text-lg">👻</span>
      </div>
      <span className="text-xs font-medium text-purple-700">Ghost Duster Buster</span>
    </div>
  );
} 