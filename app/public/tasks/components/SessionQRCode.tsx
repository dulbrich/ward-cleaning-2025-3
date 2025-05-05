"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy, Link, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { FC, useState } from "react";
import { useToast } from "../../../../components/ui/use-toast";

interface SessionQRCodeProps {
  url: string;
  size?: number;
  showSpotlight?: boolean;
  className?: string;
}

const SessionQRCode: FC<SessionQRCodeProps> = ({
  url,
  size = 120,
  showSpotlight = false,
  className = "",
}) => {
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className={`flex flex-col items-center ${className}`}>
        <div
          className={`bg-white p-3 rounded-lg shadow-sm cursor-pointer transition hover:shadow-md ${
            showSpotlight ? "hover:scale-105" : ""
          }`}
          onClick={() => showSpotlight && setIsSpotlightOpen(true)}
        >
          <QRCodeSVG
            value={url}
            size={size}
            bgColor={"#ffffff"}
            fgColor={"#000000"}
            level={"M"}
            includeMargin={false}
          />
        </div>
        
        {showSpotlight && (
          <div className="mt-2 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSpotlightOpen(true)}
              className="text-xs"
            >
              <QrCode className="h-3 w-3 mr-1" />
              Enlarge
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-xs"
            >
              {copied ? (
                <Check className="h-3 w-3 mr-1 text-green-600" />
              ) : (
                <Copy className="h-3 w-3 mr-1" />
              )}
              Copy Link
            </Button>
          </div>
        )}
      </div>

      {/* QR Code Spotlight Dialog */}
      <Dialog open={isSpotlightOpen} onOpenChange={setIsSpotlightOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan to Join Cleaning Session</DialogTitle>
            <DialogDescription>
              Have others scan this code to join the cleaning session as guests or members
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6">
            <QRCodeSVG
              value={url}
              size={280}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"M"}
              includeMargin={true}
            />
            
            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={handleCopy} className="flex-1">
                {copied ? (
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                ) : (
                  <Link className="h-4 w-4 mr-2" />
                )}
                Copy Link
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Anyone can participate with or without an account. No sign-up required.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SessionQRCode; 