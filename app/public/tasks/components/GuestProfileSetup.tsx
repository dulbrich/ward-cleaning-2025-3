"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { FC, useEffect, useState } from "react";
import { useToast } from "../../../../components/ui/use-toast";

interface GuestProfileSetupProps {
  isOpen: boolean;
  sessionId: string;
  onClose: () => void;
  onProfileComplete: (profile: {
    tempUserId: string;
    displayName: string;
    avatarUrl: string;
  }) => void;
}

interface DefaultAvatar {
  id: string;
  avatar_url: string;
  avatar_name: string;
}

// Fallback avatars in case database fetch fails
const FALLBACK_AVATARS = [
  { id: "default", avatar_url: "/images/avatars/default.png", avatar_name: "Default Avatar" },
  { id: "1", avatar_url: "/images/avatars/avatar1.png", avatar_name: "Avatar 1" },
  { id: "2", avatar_url: "/images/avatars/avatar2.png", avatar_name: "Avatar 2" },
  { id: "3", avatar_url: "/images/avatars/avatar3.png", avatar_name: "Avatar 3" },
  { id: "4", avatar_url: "/images/avatars/avatar4.png", avatar_name: "Avatar 4" },
  { id: "5", avatar_url: "/images/avatars/avatar5.png", avatar_name: "Avatar 5" },
  { id: "m1", avatar_url: "/images/avatars/monster_1.png", avatar_name: "Monster 1" },
  { id: "m2", avatar_url: "/images/avatars/monster_2.png", avatar_name: "Monster 2" },
  { id: "m3", avatar_url: "/images/avatars/monster_3.png", avatar_name: "Monster 3" },
];

const funnyNames = [
  "Speedy Cleaner",
  "Dust Buster",
  "Mop Master",
  "Vacuum Virtuoso",
  "Cleaning Champ",
  "Tidy Tornado",
  "Spotless Star",
  "Scrubbing Pro",
  "Clean Machine",
  "Shine Specialist",
];

const GuestProfileSetup: FC<GuestProfileSetupProps> = ({
  isOpen,
  sessionId,
  onClose,
  onProfileComplete,
}) => {
  const supabase = createClient();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState("");
  const [avatars, setAvatars] = useState<DefaultAvatar[]>([]);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Generate a fun display name
      const randomName = `${funnyNames[Math.floor(Math.random() * funnyNames.length)]} ${Math.floor(Math.random() * 10000)}`;
      setDisplayName(randomName);
      
      // Fetch avatars from the database
      const fetchAvatars = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from("default_avatars")
            .select("*")
            .eq("active", true);
          
          if (error) {
            throw error;
          }
          
          if (data && data.length > 0) {
            // Filter avatars to include only those that match files we know exist
            const validAvatars = data.filter((avatar: DefaultAvatar) => {
              const urlParts = avatar.avatar_url.split('/');
              const filename = urlParts.length > 0 ? urlParts[urlParts.length - 1] : '';
              // Only include avatar1-5, monster_1-3, and default.png
              return /^(avatar[1-5]|monster_[1-3]|default)\.png$/.test(filename);
            });
            
            if (validAvatars.length > 0) {
              setAvatars(validAvatars);
              // Select a random avatar from valid ones
              const randomAvatar = validAvatars[Math.floor(Math.random() * validAvatars.length)];
              setSelectedAvatarUrl(randomAvatar.avatar_url);
            } else {
              // Use fallback avatars if no valid avatars
              setAvatars(FALLBACK_AVATARS);
              setSelectedAvatarUrl(FALLBACK_AVATARS[0].avatar_url);
            }
          } else {
            // Use fallback avatars if no data
            setAvatars(FALLBACK_AVATARS);
            setSelectedAvatarUrl(FALLBACK_AVATARS[0].avatar_url);
          }
        } catch (error) {
          console.error("Error fetching avatars:", error);
          toast({
            title: "Error",
            description: "Could not load avatars. Using defaults instead.",
            variant: "destructive",
          });
          // Use fallback avatars on error
          setAvatars(FALLBACK_AVATARS);
          setSelectedAvatarUrl(FALLBACK_AVATARS[0].avatar_url);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchAvatars();
    }
  }, [isOpen, supabase, toast]);

  const handleContinue = () => {
    if (!displayName.trim()) {
      toast({
        title: "Invalid Name",
        description: "Please enter a display name",
        variant: "destructive",
      });
      return;
    }

    if (!selectedAvatarUrl) {
      toast({
        title: "No Avatar Selected",
        description: "Please select an avatar",
        variant: "destructive",
      });
      return;
    }

    // Generate a temporary user ID with anon_ prefix
    const tempUserId = `anon_${Math.random().toString(36).substring(2, 10)}`;
    
    // Store in localStorage for persistence
    localStorage.setItem(`tempUserId_${sessionId}`, tempUserId);
    
    // Call the completion handler
    onProfileComplete({
      tempUserId,
      displayName: displayName.trim(),
      avatarUrl: selectedAvatarUrl,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Create Your Guest Profile</DialogTitle>
          <DialogDescription>
            This information will only be used for today's cleaning session
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Display Name Field */}
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              maxLength={30}
              className="text-lg py-5"
            />
            <p className="text-xs text-muted-foreground">
              This is how others will see you during the cleaning session
            </p>
          </div>

          {/* Avatar Selection */}
          <div className="space-y-3">
            <Label className="text-lg">Select an Avatar</Label>
            
            {isLoading ? (
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div 
                    key={n} 
                    className="aspect-square rounded-md bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {avatars.map((avatar) => (
                  <div
                    key={avatar.id}
                    className={`
                      cursor-pointer rounded-md p-1 aspect-square
                      ${selectedAvatarUrl === avatar.avatar_url
                        ? "ring-2 ring-primary bg-primary/10"
                        : "hover:bg-muted"
                      }
                    `}
                    onClick={() => setSelectedAvatarUrl(avatar.avatar_url)}
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={avatar.avatar_url}
                        alt={avatar.avatar_name}
                        fill
                        sizes="(max-width: 768px) 25vw, 100px"
                        className="object-contain"
                      />
                    </div>
                  </div>
                ))}
                {/* Always include default avatar as a fallback */}
                <div
                  className={`
                    cursor-pointer rounded-md p-1 aspect-square
                    ${selectedAvatarUrl === "/images/avatars/default.png"
                      ? "ring-2 ring-primary bg-primary/10"
                      : "hover:bg-muted"
                    }
                  `}
                  onClick={() => setSelectedAvatarUrl("/images/avatars/default.png")}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src="/images/avatars/default.png"
                      alt="Default Avatar"
                      fill
                      sizes="(max-width: 768px) 25vw, 100px"
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Choose an avatar to represent you
            </p>
          </div>

          <Button
            className="w-full text-lg py-6"
            onClick={handleContinue}
            disabled={isLoading || !displayName.trim() || !selectedAvatarUrl}
          >
            Continue to Tasks
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestProfileSetup; 