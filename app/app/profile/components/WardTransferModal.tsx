"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { searchWards, transferToWard } from '../actions';

interface WardBranch {
  id: string;
  name: string;
  unit_type: "Ward" | "Branch";
  unit_number?: string;
  stake_district_name?: string;
}

interface WardTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWardId?: string;
  onSuccess?: () => void;
}

export const WardTransferModal = ({ 
  isOpen, 
  onClose,
  currentWardId,
  onSuccess
}: WardTransferModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<WardBranch[]>([]);
  const [selectedWard, setSelectedWard] = useState<WardBranch | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    
    try {
      const result = await searchWards(searchTerm);
      
      if (result.success) {
        // Filter out the current ward if ID is provided
        const filteredResults = currentWardId && result.data 
          ? result.data.filter(ward => ward.id !== currentWardId)
          : result.data || [];
          
        setSearchResults(filteredResults);
        
        if (filteredResults.length === 0) {
          setError('No matching wards found. Try a different search term.');
        }
      } else {
        setError(result.error || 'Error searching for wards');
      }
    } catch (e) {
      console.error('Error searching wards:', e);
      setError('An unexpected error occurred while searching');
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleTransfer = async () => {
    if (!selectedWard) return;
    
    setIsTransferring(true);
    setError(null);
    
    try {
      const result = await transferToWard(selectedWard.id, true);
      
      if (result.success) {
        toast.success('Successfully transferred to new ward');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(result.error || 'Error transferring to ward');
      }
    } catch (e) {
      console.error('Error transferring ward:', e);
      setError('An unexpected error occurred during transfer');
    } finally {
      setIsTransferring(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Ward</DialogTitle>
          <DialogDescription>
            Search for your new ward to transfer your membership
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Input 
              placeholder="Search by ward name or unit number" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSearching || isTransferring}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || isTransferring || !searchTerm.trim()}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : 'Search'}
            </Button>
          </div>
          
          {error && (
            <div className="text-sm text-red-500 p-2">
              {error}
            </div>
          )}
          
          {searchResults.length > 0 && (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {searchResults.map(ward => (
                <div 
                  key={ward.id}
                  className={`p-3 border rounded-md cursor-pointer hover:bg-muted transition-colors ${
                    selectedWard?.id === ward.id ? 'border-primary bg-primary/10' : ''
                  }`}
                  onClick={() => setSelectedWard(ward)}
                >
                  <div className="font-medium">{ward.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {ward.unit_number ? `#${ward.unit_number}` : ''} 
                    {ward.stake_district_name ? ` • ${ward.stake_district_name}` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {searchResults.length === 0 && searchTerm && !isSearching && !error && (
            <div className="text-center py-6 text-muted-foreground">
              No wards found matching "{searchTerm}"
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isTransferring}>
            Cancel
          </Button>
          <Button 
            disabled={!selectedWard || isTransferring || isSearching}
            onClick={handleTransfer}
          >
            {isTransferring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Transferring...
              </>
            ) : 'Transfer to New Ward'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 