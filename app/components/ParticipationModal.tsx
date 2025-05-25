"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Mail, Phone, TrendingDown, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";

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

interface WardMemberWithStats extends WardMember {
  participationPercentage: number;
  totalAssigned: number;
  totalParticipated: number;
}

interface ParticipationModalProps {
  group: 'A' | 'B' | 'C' | 'D';
  members: WardMember[];
  wardBranchId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Group color mappings
const GROUP_COLORS = {
  A: "#3B82F6", // Blue
  B: "#10B981", // Green  
  C: "#F59E0B", // Amber
  D: "#8B5CF6"  // Purple
};

const GROUP_RANGES = {
  A: "A-F",
  B: "G-L", 
  C: "M-R",
  D: "S-Z"
};

export default function ParticipationModal({
  group,
  members,
  wardBranchId,
  isOpen,
  onClose
}: ParticipationModalProps) {
  const [membersWithStats, setMembersWithStats] = useState<WardMemberWithStats[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch participation statistics
  useEffect(() => {
    if (isOpen && members.length > 0) {
      fetchParticipationStats();
    }
  }, [isOpen, members, wardBranchId]);

  const fetchParticipationStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ward-members/participation-stats/${wardBranchId}`);
      const data = await response.json();
      
      if (data.success && data.data.stats) {
        // Merge participation stats with member data
        const statsMap = new Map(
          data.data.stats.map((stat: any) => [stat.user_hash, stat])
        );
        
        const enhancedMembers = members.map(member => {
          const stats = statsMap.get(member.userHash || '') as any;
          return {
            ...member,
            participationPercentage: stats?.participation_percentage || 0,
            totalAssigned: stats?.total_assigned_sessions || 0,
            totalParticipated: stats?.total_participations || 0
          };
        });
        
        setMembersWithStats(enhancedMembers);
      } else {
        // Fallback: use members without stats
        const fallbackMembers = members.map(member => ({
          ...member,
          participationPercentage: 0,
          totalAssigned: 0,
          totalParticipated: 0
        }));
        setMembersWithStats(fallbackMembers);
      }
    } catch (error) {
      console.error("Error fetching participation stats:", error);
      // Fallback: use members without stats
      const fallbackMembers = members.map(member => ({
        ...member,
        participationPercentage: 0,
        totalAssigned: 0,
        totalParticipated: 0
      }));
      setMembersWithStats(fallbackMembers);
    } finally {
      setLoading(false);
    }
  };

  // Calculate group statistics
  const groupStats = {
    totalMembers: members.length,
    averageParticipation: membersWithStats.length > 0 
      ? Math.round(membersWithStats.reduce((sum, m) => sum + m.participationPercentage, 0) / membersWithStats.length)
      : 0,
    highParticipants: membersWithStats.filter(m => m.participationPercentage >= 80).length,
    lowParticipants: membersWithStats.filter(m => m.participationPercentage < 50).length
  };

  // Get participation badge color
  const getParticipationBadge = (percentage: number) => {
    if (percentage >= 80) {
      return { 
        variant: "default" as const, 
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", 
        icon: TrendingUp 
      };
    } else if (percentage >= 50) {
      return { 
        variant: "secondary" as const, 
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", 
        icon: null 
      };
    } else {
      return { 
        variant: "destructive" as const, 
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", 
        icon: TrendingDown 
      };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div 
              className="w-6 h-6 rounded"
              style={{ backgroundColor: GROUP_COLORS[group] }}
            />
            <span>Group {group} ({GROUP_RANGES[group]})</span>
            <Badge variant="outline" className="ml-2">
              {members.length} members
            </Badge>
          </DialogTitle>
          <DialogDescription>
            View detailed participation statistics and member information for Group {group}.
          </DialogDescription>
        </DialogHeader>

        {/* Group Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{groupStats.totalMembers}</div>
            <div className="text-sm text-muted-foreground">Total Members</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{groupStats.averageParticipation}%</div>
            <div className="text-sm text-muted-foreground">Avg Participation</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{groupStats.highParticipants}</div>
            <div className="text-sm text-muted-foreground">High (80%+)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{groupStats.lowParticipants}</div>
            <div className="text-sm text-muted-foreground">Low (&lt;50%)</div>
          </div>
        </div>

        {/* Member List */}
        <div className="space-y-3 mt-6">
          <h3 className="text-lg font-semibold flex items-center text-foreground">
            <Users className="w-5 h-5 mr-2" />
            Group Members
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
              <span className="ml-2 text-sm text-muted-foreground">Loading participation data...</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {membersWithStats
                .sort((a, b) => a.lastName.localeCompare(b.lastName))
                .map((member, index) => {
                  const badge = getParticipationBadge(member.participationPercentage);
                  const IconComponent = badge.icon;
                  
                  return (
                    <div 
                      key={member.userHash || index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-foreground">
                          {member.name}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          {member.phone && (
                            <div className="flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {member.phone}
                            </div>
                          )}
                          {member.email && (
                            <div className="flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {member.email}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <Badge variant={badge.variant} className={badge.className}>
                            {IconComponent && <IconComponent className="w-3 h-3 mr-1" />}
                            {member.participationPercentage}%
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {member.totalParticipated}/{member.totalAssigned} sessions
                        </div>
                      </div>
                    </div>
                  );
                })}
              
              {membersWithStats.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No members found in this group.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 