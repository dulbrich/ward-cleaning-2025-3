"use client";

import { Badge } from "@/components/ui/badge";
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "@radix-ui/react-icons";

interface PriorityIconProps {
  priority: string;
  showText?: boolean;
}

export function PriorityIcon({ priority, showText = false }: PriorityIconProps) {
  let icon = null;
  let text = "";
  let variant: "outline" | "default" | "secondary" | "destructive" = "outline";

  switch (priority) {
    case "high":
    case "do_first":
      icon = <ArrowUpIcon className="h-4 w-4" />;
      text = "Do First";
      variant = "destructive";
      break;
    case "low":
    case "do_last":
      icon = <ArrowDownIcon className="h-4 w-4" />;
      text = "Do Last";
      variant = "secondary";
      break;
    default:
      icon = <MinusIcon className="h-4 w-4" />;
      text = "Normal";
      variant = "outline";
  }

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      {icon}
      {showText && <span>{text}</span>}
    </Badge>
  );
} 