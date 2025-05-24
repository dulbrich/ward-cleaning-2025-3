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
  onGroupChange: (userHash: string, newGroup: string, householdId: string) => void;
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
  onGroupChange,
  onViewParticipants,
  height = CONTAINER_HEIGHT
}: GroupAssignmentVisualizerProps) {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [groupDistributions, setGroupDistributions] = useState<GroupDistribution[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragBoundaryIndex, setDragBoundaryIndex] = useState(-1);

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
    const householdList = groupMembersByHousehold(wardMembers);
    setHouseholds(householdList);
    
    const distributions = calculateGroupDistributions(householdList);
    setGroupDistributions(distributions);
  }, [wardMembers, groupMembersByHousehold, calculateGroupDistributions]);

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
    
    // Simple threshold-based redistribution
    if (Math.abs(deltaY) > 30) {
      const currentGroup = groupDistributions[dragBoundaryIndex];
      const nextGroup = groupDistributions[dragBoundaryIndex + 1];
      
      if (currentGroup && nextGroup) {
        // Find households to move based on drag direction
        if (deltaY > 0 && currentGroup.households.length > 0) {
          // Move household from current to next group
          const householdToMove = currentGroup.households[currentGroup.households.length - 1];
          redistributeHousehold(householdToMove, nextGroup.group);
        } else if (deltaY < 0 && nextGroup.households.length > 0) {
          // Move household from next to current group
          const householdToMove = nextGroup.households[0];
          redistributeHousehold(householdToMove, currentGroup.group);
        }
      }
      
      // Reset drag position to prevent multiple moves
      setDragStartY(clientY);
    }
  }, [isDragging, dragBoundaryIndex, dragStartY, groupDistributions]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragBoundaryIndex(-1);
    setDragStartY(0);
  }, []);

  // Redistribute household to new group
  const redistributeHousehold = (household: Household, newGroup: 'A' | 'B' | 'C' | 'D') => {
    // Update household group
    const updatedHouseholds = households.map(h => 
      h.id === household.id ? { ...h, currentGroup: newGroup } : h
    );
    setHouseholds(updatedHouseholds);
    
    // Update group distributions
    const newDistributions = calculateGroupDistributions(updatedHouseholds);
    setGroupDistributions(newDistributions);
    
    // Notify parent component of changes
    household.members.forEach(member => {
      if (member.userHash) {
        onGroupChange(member.userHash, newGroup, household.id);
      }
    });
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