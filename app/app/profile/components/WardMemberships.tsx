"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRightLeft, HomeIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getUserWards } from '../actions';
import { WardTransferModal } from './WardTransferModal';

interface WardBranch {
  id: string;
  name: string;
  unit_type: string;
  unit_number?: string;
  stake_district_name?: string;
}

interface WardMembership {
  id: string;
  role: string;
  is_active: boolean;
  joined_at: string;
  ward_branch: WardBranch;
}

export function WardMemberships() {
  const [memberships, setMemberships] = useState<WardMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [currentWardId, setCurrentWardId] = useState<string | undefined>();
  
  const fetchWardMemberships = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getUserWards();
      
      if (result.success) {
        setMemberships(result.data as WardMembership[] || []);
        
        // Find active ward to set as current
        const activeWard = result.data?.find(m => m.is_active);
        if (activeWard) {
          setCurrentWardId(activeWard.ward_branch.id);
        }
      } else {
        setError(result.error || 'Failed to load ward memberships');
      }
    } catch (e) {
      console.error('Error fetching ward memberships:', e);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchWardMemberships();
  }, []);
  
  const handleOpenTransferModal = () => {
    setShowTransferModal(true);
  };
  
  const handleCloseTransferModal = () => {
    setShowTransferModal(false);
  };
  
  const handleSuccessfulTransfer = () => {
    fetchWardMemberships();
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ward Memberships</CardTitle>
          <CardDescription>Loading your ward memberships...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ward Memberships</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Ward Memberships</span>
            <Button variant="outline" size="sm" onClick={handleOpenTransferModal}>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transfer Ward
            </Button>
          </CardTitle>
          <CardDescription>
            Wards and branches you are a member of
          </CardDescription>
        </CardHeader>
        <CardContent>
          {memberships.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>You are not a member of any wards yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {memberships.map(membership => (
                <div 
                  key={membership.id} 
                  className="p-4 border rounded-lg flex items-start justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <HomeIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{membership.ward_branch.name}</span>
                      {membership.is_active && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground mt-1">
                      {membership.ward_branch.unit_number && (
                        <span className="mr-2">#{membership.ward_branch.unit_number}</span>
                      )}
                      {membership.ward_branch.stake_district_name && (
                        <span>{membership.ward_branch.stake_district_name}</span>
                      )}
                    </div>
                    
                    <div className="text-sm mt-2">
                      <span className="capitalize">{membership.role}</span>
                      {/* Add formatted join date if needed */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <WardTransferModal 
        isOpen={showTransferModal}
        onClose={handleCloseTransferModal}
        currentWardId={currentWardId}
        onSuccess={handleSuccessfulTransfer}
      />
    </>
  );
} 