import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function getTaskStatusText(status: string) {
  switch (status) {
    case "todo":
      return "To Do";
    case "doing":
      return "In Progress";
    case "done":
      return "Completed";
    default:
      return "Unknown";
  }
}

export function getTaskStatusColor(status: string) {
  switch (status) {
    case "todo":
      return "border-blue-200";
    case "doing":
      return "border-indigo-200";
    case "done":
      return "border-green-200";
    default:
      return "border-gray-200";
  }
}

export function getTaskKidFriendlyText(kidFriendly?: boolean) {
  return kidFriendly ? "Kid Friendly" : "Adult Help";
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 