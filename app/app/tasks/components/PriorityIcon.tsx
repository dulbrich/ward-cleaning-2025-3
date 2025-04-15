import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, CircleDot } from "lucide-react";
import React from "react";

interface PriorityIconProps {
  priority: "do_first" | "do_last" | "normal" | string;
  className?: string;
}

export const PriorityIcon: React.FC<PriorityIconProps> = ({ priority, className }) => {
  // Determine which icon to render based on the priority value
  switch (priority) {
    case "do_first":
      return <ArrowUp className={cn("text-red-500", className)} />;
    case "do_last":
      return <ArrowDown className={cn("text-blue-500", className)} />;
    case "normal":
    default:
      return <CircleDot className={cn("text-gray-500", className)} />;
  }
};

export default PriorityIcon; 