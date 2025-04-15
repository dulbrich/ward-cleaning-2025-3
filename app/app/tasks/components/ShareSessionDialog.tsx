"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Copy, Link2, QrCode, Share } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface ShareSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  publicAccessCode: string;
}

const ShareSessionDialog: React.FC<ShareSessionDialogProps> = ({
  isOpen,
  onClose,
  sessionId,
  publicAccessCode,
}) => {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  
  useEffect(() => {
    // Check if navigator.share is available in this browser
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);
  
  // Base URL construction should account for production/development environment
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : '';
    
  const publicSessionUrl = `${baseUrl}/public-session/${publicAccessCode}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(publicSessionUrl).then(() => {
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 3000);
    });
  };
  
  const handleShare = async () => {
    if (canShare) {
      try {
        await navigator.share({
          title: 'Join Ward Cleaning Session',
          text: 'Help us with the ward cleaning! Click the link to view and claim tasks.',
          url: publicSessionUrl,
        });
        toast.success("Shared successfully");
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error("Failed to share");
          console.error('Error sharing:', error);
        }
      }
    } else {
      handleCopy();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Cleaning Session</DialogTitle>
          <DialogDescription>
            Share this link with anyone you'd like to help with the cleaning tasks.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="link" className="mt-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              <span>Link</span>
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span>QR Code</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="mt-4">
            <div className="flex items-center space-x-2">
              <Input
                value={publicSessionUrl}
                readOnly
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              Anyone with this link can join the cleaning session, even without an account.
            </p>
            
            {canShare && (
              <Button 
                variant="outline" 
                onClick={handleShare} 
                className="mt-4 w-full"
              >
                <Share className="mr-2 h-4 w-4" />
                Share via...
              </Button>
            )}
          </TabsContent>
          
          <TabsContent value="qr" className="mt-4">
            <div className="flex flex-col items-center justify-center py-4">
              <QRCodeSVG 
                value={publicSessionUrl} 
                size={200}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"L"}
                includeMargin={false}
              />
              <p className="text-sm text-muted-foreground mt-4">
                Scan this QR code to join the cleaning session.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ShareSessionDialog; 