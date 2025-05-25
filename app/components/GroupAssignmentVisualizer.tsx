"use client";

import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { GripVertical, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// Types
interface WardMember {
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  userHash?: string;
  group: string;
}

interface Household {
  id: string;
  members: WardMember[];
  lastName: string;
  currentGroup: 'A' | 'B' | 'C' | 'D';
}

interface GroupDistribution {
  group: 'A' | 'B' | 'C' | 'D';
  households: Household[];
  memberCount: number;
  percentage: number;
  color: string;
  height: number;
}

interface GroupAssignmentVisualizerProps {
  wardMembers: WardMember[];
  wardBranchId: string;
  onBulkGroupChange: (assignments: Array<{ userHash: string; newGroup: string; householdId: string }>) => Promise<void>;
  onViewParticipants: (group: 'A' | 'B' | 'C' | 'D', members: WardMember[]) => void;
  height?: number;
}

// Group colors matching the specification
const GROUP_COLORS = {
  A: "#3B82F6", // Blue
  B: "#10B981", // Green  
  C: "#F59E0B", // Amber
  D: "#8B5CF6"  // Purple
};

const GROUP_LABELS = {
  A: "A-F",
  B: "G-L", 
  C: "M-R",
  D: "S-Z"
};

const CONTAINER_HEIGHT = 650;
const DIVIDER_HEIGHT = 32;
const MIN_SECTION_HEIGHT = 140;

export default function GroupAssignmentVisualizer({
  wardMembers,
  wardBranchId,
  onBulkGroupChange,
  onViewParticipants,
  height = CONTAINER_HEIGHT
}: GroupAssignmentVisualizerProps) {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [groupDistributions, setGroupDistributions] = useState<GroupDistribution[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragBoundaryIndex, setDragBoundaryIndex] = useState(-1);
  const [pendingChanges, setPendingChanges] = useState<Map<string, string>>(new Map()); // userHash -> newGroup
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Group members by household
  const groupMembersByHousehold = useCallback((members: WardMember[]): Household[] => {
    const householdMap = new Map<string, WardMember[]>();
    
    members.forEach(member => {
      const householdKey = member.lastName.toLowerCase();
      if (!householdMap.has(householdKey)) {
        householdMap.set(householdKey, []);
      }
      householdMap.get(householdKey)!.push(member);
    });

    return Array.from(householdMap.entries()).map(([lastName, members]) => {
      // All household members should have the same group
      const currentGroup = (members[0]?.group || 'A') as 'A' | 'B' | 'C' | 'D';
      
      return {
        id: `household_${lastName}`,
        members,
        lastName: members[0]?.lastName || lastName,
        currentGroup
      };
    }).sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, []);

  // Calculate group distributions
  const calculateGroupDistributions = useCallback((householdList: Household[]): GroupDistribution[] => {
    const groups = ['A', 'B', 'C', 'D'] as const;
    const totalMembers = householdList.reduce((sum, h) => sum + h.members.length, 0);
    
    // Calculate available height for sections (subtract divider space)
    const availableHeight = height - (3 * DIVIDER_HEIGHT); // 3 dividers between 4 sections
    
    const distributions: GroupDistribution[] = groups.map(group => {
      const groupHouseholds = householdList.filter(h => h.currentGroup === group);
      const memberCount = groupHouseholds.reduce((sum, h) => sum + h.members.length, 0);
      const percentage = totalMembers > 0 ? (memberCount / totalMembers) * 100 : 25;
      
      // Calculate height, ensuring minimum height and proportional distribution
      const idealHeight = (percentage / 100) * availableHeight;
      const sectionHeight = Math.max(MIN_SECTION_HEIGHT, idealHeight);
      
      return {
        group,
        households: groupHouseholds,
        memberCount,
        percentage,
        color: GROUP_COLORS[group],
        height: sectionHeight
      };
    });
    
    // Adjust heights to fit exactly within available space
    const totalCalculatedHeight = distributions.reduce((sum, d) => sum + d.height, 0);
    if (totalCalculatedHeight !== availableHeight) {
      const scaleFactor = availableHeight / totalCalculatedHeight;
      distributions.forEach(d => {
        d.height = Math.max(MIN_SECTION_HEIGHT, d.height * scaleFactor);
      });
    }
    
    return distributions;
  }, [height]);

  // Initialize households and distributions
  useEffect(() => {
    // Only update state if we're not currently saving, don't have pending changes, and didn't just save
    // This prevents the UI from flickering when the parent state updates during save
    if (!isSaving && pendingChanges.size === 0 && !justSaved) {
      const householdList = groupMembersByHousehold(wardMembers);
      setHouseholds(householdList);
      
      const distributions = calculateGroupDistributions(householdList);
      setGroupDistributions(distributions);
      
      if (!isInitialized) {
        setIsInitialized(true);
      }
    }
  }, [wardMembers, groupMembersByHousehold, calculateGroupDistributions, isSaving, pendingChanges.size, isInitialized, justSaved]);

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, boundaryIndex: number) => {
    e.preventDefault();
    setIsDragging(true);
    setDragBoundaryIndex(boundaryIndex);
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
  };

  // Handle drag move
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || dragBoundaryIndex < 0) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - dragStartY;
    
    // Continuous redistribution based on cumulative drag distance
    // Every 40 pixels of drag distance moves one household
    const moveThreshold = 40;
    const householdsToMove = Math.floor(Math.abs(deltaY) / moveThreshold);
    
    if (householdsToMove > 0) {
      const currentGroup = groupDistributions[dragBoundaryIndex];
      const nextGroup = groupDistributions[dragBoundaryIndex + 1];
      
      if (currentGroup && nextGroup) {
        let moved = 0;
        
        if (deltaY > 0) {
          // Dragging DOWN: Move households from next group to current group (upper group gets bigger)
          while (moved < householdsToMove && nextGroup.households.length > 0) {
            const householdToMove = nextGroup.households[0];
            redistributeHousehold(householdToMove, currentGroup.group);
            moved++;
          }
        } else if (deltaY < 0) {
          // Dragging UP: Move households from current group to next group (upper group gets smaller)
          while (moved < householdsToMove && currentGroup.households.length > 0) {
            const householdToMove = currentGroup.households[currentGroup.households.length - 1];
            redistributeHousehold(householdToMove, nextGroup.group);
            moved++;
          }
        }
        
        // Update drag start position based on how many households were actually moved
        // This allows for continuous dragging while preventing duplicate moves
        if (moved > 0) {
          const pixelsPerMove = moveThreshold;
          const newDragStart = dragStartY + (moved * pixelsPerMove * (deltaY > 0 ? 1 : -1));
          setDragStartY(newDragStart);
        }
      }
    }
  }, [isDragging, dragBoundaryIndex, dragStartY, groupDistributions]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragBoundaryIndex(-1);
    setDragStartY(0);
  }, []);

  // Redistribute household to new group (local state only, no API call)
  const redistributeHousehold = (household: Household, newGroup: 'A' | 'B' | 'C' | 'D') => {
    // Update household group in local state
    const updatedHouseholds = households.map(h => 
      h.id === household.id ? { ...h, currentGroup: newGroup } : h
    );
    setHouseholds(updatedHouseholds);
    
    // Update group distributions
    const newDistributions = calculateGroupDistributions(updatedHouseholds);
    setGroupDistributions(newDistributions);
    
    // Track pending changes for each member in the household
    const newPendingChanges = new Map(pendingChanges);
    household.members.forEach(member => {
      if (member.userHash) {
        newPendingChanges.set(member.userHash, newGroup);
      }
    });
    setPendingChanges(newPendingChanges);
  };

  // Save all pending changes to the database
  const handleSaveChanges = async () => {
    if (pendingChanges.size === 0) return;
    
    setIsSaving(true);
    setJustSaved(false);
    
    // Store current state as backup in case of error
    const backupHouseholds = [...households];
    const backupDistributions = [...groupDistributions];
    
    try {
      // Collect all changes for batch processing
      const batchChanges: Array<{ userHash: string; newGroup: string; householdId: string }> = [];
      
      pendingChanges.forEach((newGroup, userHash) => {
        const member = wardMembers.find(m => m.userHash === userHash);
        if (member) {
          const household = households.find(h => h.members.some(m => m.userHash === userHash));
          if (household) {
            batchChanges.push({
              userHash,
              newGroup,
              householdId: household.id
            });
          }
        }
      });
      
      // Send all changes as a single batch to avoid race conditions
      if (batchChanges.length > 0) {
        await onBulkGroupChange(batchChanges);
      }
      
      // Mark that we just saved to prevent useEffect from resetting state
      setJustSaved(true);
      
      // Clear pending changes after successful save
      setPendingChanges(new Map());
      
      // Reset the justSaved flag after a delay to allow normal state sync later
      setTimeout(() => {
        setJustSaved(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error saving changes:', error);
      
      // Restore backup state on error
      setHouseholds(backupHouseholds);
      setGroupDistributions(backupDistributions);
      
      // Don't clear pending changes so user can retry
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset all pending changes
  const handleResetChanges = () => {
    // Reset to original ward member groups
    const originalHouseholds = groupMembersByHousehold(wardMembers);
    setHouseholds(originalHouseholds);
    
    const originalDistributions = calculateGroupDistributions(originalHouseholds);
    setGroupDistributions(originalDistributions);
    
    // Clear pending changes and reset save flag
    setPendingChanges(new Map());
    setJustSaved(false);
  };

  // Add event listeners for drag
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleDragMove(e);
      const handleMouseUp = () => handleDragEnd();
      const handleTouchMove = (e: TouchEvent) => handleDragMove(e);
      const handleTouchEnd = () => handleDragEnd();
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Instructions */}
      <Card className="p-4 max-w-2xl">
        <p className="text-center text-sm text-muted-foreground">
          Drag the handles between sections to redistribute ward members across cleaning groups. 
          Households will stay together during redistribution.
        </p>
      </Card>
      
      {/* Save/Reset Controls - Show when there are pending changes */}
      {pendingChanges.size > 0 && (
        <Card className="p-4 max-w-2xl w-full border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-amber-700 dark:text-amber-300 flex items-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse"></div>
              {pendingChanges.size} unsaved change{pendingChanges.size !== 1 ? 's' : ''}
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleResetChanges}
                disabled={isSaving}
                className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900"
              >
                Reset
              </Button>
              <Button 
                size="sm"
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      {/* Visualizer Container */}
      <Card className="overflow-hidden w-full max-w-md">
        <div 
          className="relative"
          style={{ height: `${height}px` }}
        >
          {groupDistributions.map((distribution, index) => (
            <div key={distribution.group}>
              {/* Group Section */}
              <div
                className="relative flex flex-col cursor-pointer hover:opacity-95 transition-all duration-200"
                style={{
                  backgroundColor: distribution.color,
                  height: `${distribution.height}px`,
                }}
                onClick={() => onViewParticipants(distribution.group, 
                  distribution.households.flatMap(h => h.members)
                )}
              >
                {/* Top row with header and button - Absolute positioned */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                  {/* Group Header */}
                  <div className="text-white/90 text-sm font-medium">
                    Group {distribution.group}
                    <div className="text-white/70 text-xs">
                      {GROUP_LABELS[distribution.group]}
                    </div>
                  </div>
                  
                  {/* View Details Button - Top right */}
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs px-3 py-1 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewParticipants(distribution.group, 
                        distribution.households.flatMap(h => h.members)
                      );
                    }}
                  >
                    View Details
                  </Button>
                </div>
                
                {/* Member Count - Perfectly centered vertically and horizontally */}
                <div className="flex-1 flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold">{distribution.memberCount}</div>
                    <div className="text-sm opacity-90 flex items-center justify-center mt-1">
                      <Users className="w-4 h-4 mr-1" />
                      {distribution.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Drag Handle (except for last section) */}
              {index < groupDistributions.length - 1 && (
                <div
                  className={cn(
                    "relative bg-border hover:bg-border/80 flex items-center justify-center cursor-ns-resize transition-colors touch-manipulation border-t border-b",
                    isDragging && dragBoundaryIndex === index && "bg-primary/20"
                  )}
                  style={{ height: `${DIVIDER_HEIGHT}px` }}
                  onMouseDown={(e) => handleDragStart(e, index)}
                  onTouchStart={(e) => handleDragStart(e, index)}
                >
                  <div 
                    className={cn(
                      "flex items-center justify-center w-8 h-6 bg-background border rounded-md shadow-sm transition-transform",
                      isDragging && dragBoundaryIndex === index && "scale-110"
                    )}
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
      
      {/* Group Summary */}
      <Card className="p-4 w-full max-w-2xl">
        <h3 className="text-sm font-medium mb-3 text-center">Group Distribution Summary</h3>
        <div className="grid grid-cols-2 gap-3">
          {groupDistributions.map(distribution => (
            <div key={distribution.group} className="flex items-center space-x-3 p-2 rounded-md bg-muted/50">
              <div 
                className="w-4 h-4 rounded-sm flex-shrink-0"
                style={{ backgroundColor: distribution.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">Group {distribution.group}</div>
                <div className="text-xs text-muted-foreground">
                  {distribution.memberCount} members ({distribution.percentage.toFixed(1)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 