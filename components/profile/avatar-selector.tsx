"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";

interface AvatarSelectorProps {
  currentAvatar: string;
  onSelect: (url: string) => void;
  onCancel: () => void;
}

// Avatar categories and paths
const DEFAULT_AVATARS = [
  "/images/avatars/default.png",
  "/images/avatars/avatar1.png",
  "/images/avatars/avatar2.png",
  "/images/avatars/avatar3.png",
  "/images/avatars/avatar4.png",
  "/images/avatars/avatar5.png",
];

const MONSTER_AVATARS = Array.from({ length: 12 }, (_, i) => 
  `/images/avatars/monster_${i + 1}.png`
);

export function AvatarSelector({ currentAvatar, onSelect, onCancel }: AvatarSelectorProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar);
  const [activeTab, setActiveTab] = useState<string>("default");
  const [customImage, setCustomImage] = useState<File | null>(null);
  const [customImagePreview, setCustomImagePreview] = useState<string | null>(null);

  // Handle file upload for custom avatar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file type
      if (!file.type.match(/image\/(jpeg|jpg|png|gif)/i)) {
        alert("File format not supported. Please upload a JPG, PNG, or GIF image.");
        return;
      }
      
      setCustomImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomImagePreview(event.target.result as string);
          setSelectedAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (customImagePreview) {
        URL.revokeObjectURL(customImagePreview);
      }
    };
  }, [customImagePreview]);

  const handleConfirm = () => {
    if (customImage && customImagePreview) {
      // In a real implementation, we would upload the file to a server and get a URL back
      // For now, we'll just use the preview URL
      onSelect(customImagePreview);
    } else {
      onSelect(selectedAvatar);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose an Avatar</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="default" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="default">Default</TabsTrigger>
            <TabsTrigger value="monster">Monster</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
          
          {/* Default Avatars */}
          <TabsContent value="default" className="mt-4">
            <div className="grid grid-cols-3 gap-4">
              {DEFAULT_AVATARS.map((avatar, index) => (
                <div
                  key={index}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 aspect-square ${
                    selectedAvatar === avatar ? "border-primary" : "border-transparent"
                  }`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  <img 
                    src={avatar} 
                    alt={`Avatar ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </TabsContent>
          
          {/* Monster Avatars */}
          <TabsContent value="monster" className="mt-4">
            <div className="grid grid-cols-3 gap-4 max-h-[300px] overflow-y-auto">
              {MONSTER_AVATARS.map((avatar, index) => (
                <div
                  key={index}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 aspect-square ${
                    selectedAvatar === avatar ? "border-primary" : "border-transparent"
                  }`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  <img 
                    src={avatar} 
                    alt={`Monster Avatar ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </TabsContent>
          
          {/* Custom Avatar Upload */}
          <TabsContent value="custom" className="mt-4">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
                  {customImagePreview ? (
                    <img 
                      src={customImagePreview} 
                      alt="Custom Avatar Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-muted-foreground text-sm text-center px-2">
                      Upload an image
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-center">
                <label className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm cursor-pointer">
                  Choose File
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/gif"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Recommended: Square JPG, PNG, or GIF, at least 400x400 pixels.
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Select Avatar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 