"use client";

import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/app/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Plus, Trash2, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { WardSelectionDropdown } from "./WardSelectionDropdown";

type Ward = {
  id: string;
  name: string;
  stake_name?: string;
  is_branch: boolean;
  member_role: string;
  member_since: string;
};

interface WardMembershipManagerProps {
  userId: string;
  className?: string;
}

export function WardMembershipManager({ userId, className }: WardMembershipManagerProps) {
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addWardDialogOpen, setAddWardDialogOpen] = useState(false);
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);
  const [addingWard, setAddingWard] = useState(false);
  const [removingWardId, setRemovingWardId] = useState<string | null>(null);
  
  const supabase = createClient();

  // Fetch user's ward memberships
  useEffect(() => {
    const fetchWardMemberships = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('ward_branch_members')
          .select(`
            id,
            role,
            joined_at,
            ward_branch:ward_branch_id (
              id,
              name,
              stake_name,
              is_branch
            )
          `)
          .eq('user_id', userId);
          
        if (error) {
          throw error;
        }
        
        // Transform the data to a more usable format
        const wardData = data.map((item: any) => ({
          id: item.ward_branch.id,
          name: item.ward_branch.name,
          stake_name: item.ward_branch.stake_name,
          is_branch: item.ward_branch.is_branch,
          member_role: item.role,
          member_since: item.joined_at
        }));
        
        setWards(wardData);
      } catch (error: any) {
        console.error('Error fetching ward memberships:', error);
        setError('Failed to load ward memberships');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchWardMemberships();
    }
  }, [userId, supabase]);
  
  // Handle adding a new ward membership
  const handleAddWard = async () => {
    if (!selectedWardId) return;
    
    setAddingWard(true);
    try {
      // Call associate_user_with_ward function
      const { data, error } = await supabase.rpc('associate_user_with_ward', {
        p_user_id: userId,
        p_ward_branch_id: selectedWardId,
        p_role: 'member'
      });
      
      if (error) throw error;
      
      // Fetch the newly added ward details
      const { data: wardData, error: wardError } = await supabase
        .from('ward_branches')
        .select('id, name, stake_district_name, unit_type')
        .eq('id', selectedWardId)
        .single();
        
      if (wardError) throw wardError;
      
      // Add the new ward to the list
      const newWard: Ward = {
        id: wardData.id,
        name: wardData.name,
        stake_name: wardData.stake_district_name,
        is_branch: wardData.unit_type === 'Branch',
        member_role: 'member',
        member_since: new Date().toISOString()
      };
      
      setWards([...wards, newWard]);
      setAddWardDialogOpen(false);
      setSelectedWardId(null);
    } catch (error: any) {
      console.error('Error adding ward membership:', error);
      setError('Failed to add ward membership');
    } finally {
      setAddingWard(false);
    }
  };
  
  // Handle removing a ward membership
  const handleRemoveWard = async (wardId: string) => {
    setRemovingWardId(wardId);
    try {
      // Delete the membership record
      const { error } = await supabase
        .from('ward_branch_members')
        .delete()
        .eq('user_id', userId)
        .eq('ward_branch_id', wardId);
        
      if (error) throw error;
      
      // Update the UI to remove the ward
      setWards(wards.filter(ward => ward.id !== wardId));
    } catch (error: any) {
      console.error('Error removing ward membership:', error);
      setError('Failed to remove ward membership');
    } finally {
      setRemovingWardId(null);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading ward memberships...</span>
      </div>
    );
  }
  
  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Ward Memberships</h2>
        <Dialog open={addWardDialogOpen} onOpenChange={setAddWardDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              <span>Add Ward</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Ward Membership</DialogTitle>
              <DialogDescription>
                Search for and select a ward to join as a member.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <WardSelectionDropdown 
                onWardSelect={(wardId) => setSelectedWardId(wardId)}
                label="Select Ward"
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddWardDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddWard} 
                disabled={!selectedWardId || addingWard}
              >
                {addingWard ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>Join Ward</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {wards.length === 0 ? (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <UserCheck className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
          <h3 className="font-medium mb-1">No Ward Memberships</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You are not currently a member of any wards.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAddWardDialogOpen(true)}
          >
            Add Your First Ward
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {wards.map(ward => (
            <Card key={ward.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{ward.name}</CardTitle>
                <CardDescription>
                  {ward.stake_name} {ward.is_branch ? 'Branch' : 'Ward'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role:</span>
                    <span className="font-medium capitalize">{ward.member_role}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-muted-foreground">Member since:</span>
                    <span>{formatDate(ward.member_since)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                  onClick={() => handleRemoveWard(ward.id)}
                  disabled={removingWardId === ward.id}
                >
                  {removingWardId === ward.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span className="ml-1">Leave Ward</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 