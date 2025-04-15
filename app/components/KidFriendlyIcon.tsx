"use client";

import { Badge } from "@/components/ui/badge";
import { HeartFilledIcon } from "@radix-ui/react-icons";

interface KidFriendlyIconProps {
  kidFriendly: boolean;
  showText?: boolean;
}

export function KidFriendlyIcon({ kidFriendly, showText = false }: KidFriendlyIconProps) {
  if (!kidFriendly) return null;

  return (
    <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
      <HeartFilledIcon className="h-3 w-3 mr-1" />
      {showText && "Kid-friendly"}
    </Badge>
  );
} 