"use client";

import { Button } from "@/app/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/app/components/ui/command";
import { Label } from "@/app/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/components/ui/popover";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { CheckIcon, ChevronsUpDown, PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";

type Ward = {
  id: string;
  name: string;
  stake_name?: string;
  unit_number?: string;
  is_branch: boolean;
};

type WardSelectionDropdownProps = {
  onWardSelect: (wardId: string) => void;
  selectedWardId?: string;
  canCreateWard?: boolean;
  className?: string;
  label?: string;
};

export function WardSelectionDropdown({
  onWardSelect,
  selectedWardId,
  canCreateWard = false,
  className,
  label = "Select Ward"
}: WardSelectionDropdownProps) {
  const [open, setOpen] = useState(false);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const supabase = createClient();
  
  // Fetch wards when component mounts
  useEffect(() => {
    const fetchWards = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('ward_branches')
          .select('id, name, stake_district_name, unit_number, unit_type')
          .order('name');
          
        if (error) {
          console.error('Error fetching wards:', error);
        } else if (data) {
          // Transform data to match our component's expected format
          const transformedData = data.map((ward: {
            id: string;
            name: string;
            stake_district_name: string;
            unit_number: string;
            unit_type: string;
          }) => ({
            id: ward.id,
            name: ward.name,
            stake_name: ward.stake_district_name,
            unit_number: ward.unit_number,
            is_branch: ward.unit_type === 'Branch'
          }));
          setWards(transformedData);
          
          // Set selected ward if ID is provided
          if (selectedWardId) {
            const ward = transformedData.find((w: Ward) => w.id === selectedWardId);
            if (ward) {
              setSelectedWard(ward);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch wards:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWards();
  }, [selectedWardId, supabase]);
  
  // Filter wards based on search query
  const filteredWards = searchQuery
    ? wards.filter(ward => 
        ward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ward.stake_name && ward.stake_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ward.unit_number && ward.unit_number.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : wards;
  
  // Function to handle ward selection
  const handleWardSelect = (ward: Ward) => {
    setSelectedWard(ward);
    onWardSelect(ward.id);
    setOpen(false);
  };
  
  // Navigate to ward creation if user has permission
  const handleCreateNewWard = () => {
    // Redirect to ward creation page or show modal
    console.log('Create new ward');
    // Implementation will depend on app's navigation logic
  };
  
  return (
    <div className={className}>
      {label && <Label className="mb-2 block">{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedWard ? selectedWard.name : "Select a ward..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput
              placeholder="Search wards..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>
                {loading ? "Loading wards..." : "No wards found."}
              </CommandEmpty>
              <CommandGroup heading="Wards">
                {filteredWards.map((ward) => (
                  <CommandItem
                    key={ward.id}
                    value={ward.id}
                    onSelect={() => handleWardSelect(ward)}
                    className="flex items-center"
                  >
                    <div className="flex-1">
                      <span className="font-medium">{ward.name}</span>
                      {ward.stake_name && (
                        <p className="text-xs text-muted-foreground">
                          {ward.stake_name} {ward.is_branch ? "Branch" : "Ward"}
                        </p>
                      )}
                    </div>
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedWard?.id === ward.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              
              {canCreateWard && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={handleCreateNewWard}
                      className="text-primary cursor-pointer"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      <span>Create New Ward</span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
} 