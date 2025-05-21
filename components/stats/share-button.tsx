"use client";

import { Button } from "@/components/ui/button";
import { Copy, Share } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ShareStatsButton() {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const url = typeof window !== "undefined" ? window.location.href : "";

  const handleShare = async () => {
    if (canShare) {
      try {
        await navigator.share({ title: "My Cleaning Stats", url });
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      {canShare ? <Share className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
      {canShare ? "Share" : "Copy Link"}
    </Button>
  );
}
