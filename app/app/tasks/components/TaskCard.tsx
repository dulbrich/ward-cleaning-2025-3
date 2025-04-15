"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Star } from "lucide-react";
import { AvatarGroup } from "./AvatarGroup";
import { PriorityIcon } from "./PriorityIcon";

// Add this utility function for safely rendering HTML
function createMarkup(html: string) {
  return { __html: html };
}

// Utility functions for task status and properties
const getTaskStatusColor = (status: string) => {
  switch (status) {
    case "todo":
      return "border-blue-100";
    case "doing":
      return "border-indigo-100";
    case "done":
      return "border-green-100";
    default:
      return "border-gray-100";
  }
};

const getTaskStatusText = (status: string) => {
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
};

const getTaskKidFriendlyText = () => {
  return "Kid Friendly";
};

interface WardTask {
  id: string;
  title: string;
  subtitle?: string;
  instructions: string;
  equipment: string;
  safety?: string;
  color?: string;
  priority?: string;
  kid_friendly?: boolean;
  points?: number;
}

interface SessionTask {
  id: string;
  session_id: string;
  task_id: string;
  status: "todo" | "doing" | "done";
  assigned_to?: string;
  assigned_to_temp_user?: string;
  assigned_at?: string;
  completed_at?: string;
  points_awarded?: number;
  task: WardTask;
  assignee?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface Props {
  id?: string;
  task: SessionTask;
  status?: string;
  points?: number;
  assigned_to?: string;
  assigned_to_temp_user?: string;
  assignee?: {
    display_name: string;
    avatar_url?: string;
  };
  viewers?: Array<any>;
  onClick?: (id?: string) => void;
  children?: React.ReactNode;
  orderNumber?: number;
}

export const TaskCard = ({
  id,
  task,
  status,
  points,
  assigned_to,
  assigned_to_temp_user,
  assignee,
  viewers = [],
  onClick,
  children,
  orderNumber
}: Props) => {
  // Get status for styling and text
  const currentStatus = status || task.status;
  
  // Create card style with left border from task color (like in task builder)
  const cardStyle = task.task.color
    ? {
        borderLeft: `4px solid ${task.task.color}`,
      }
    : {};
  
  return (
    <Card
      onClick={() => onClick?.(id || task.id)}
      className={`w-full h-full flex flex-col cursor-pointer hover:border-primary border shadow-sm`}
      style={cardStyle}
    >
      <CardHeader className="relative pb-2">
        {orderNumber !== undefined && (
          <div className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-muted rounded-full">
            <span className="text-xs font-medium">{orderNumber}</span>
          </div>
        )}
        <CardTitle className="text-base pr-8">{task.task.title}</CardTitle>
        <CardDescription>
          <span className="line-clamp-2" dangerouslySetInnerHTML={createMarkup(task.task.instructions)} />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pb-2">
        {children}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2 pt-0">
        <div className="flex flex-wrap w-full gap-1">
          {/* Points Badge */}
          <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
            <Star className="h-3 w-3" />
            {points || task.task.points || 5} points
          </Badge>
          
          {/* Kid-friendly badge - only show if true */}
          {task.task.kid_friendly && (
            <Badge 
              variant="outline" 
              className="flex items-center gap-1 bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100"
            >
              {getTaskKidFriendlyText()}
            </Badge>
          )}
          
          {/* Priority chip */}
          {task.task.priority && (
            <Badge 
              variant={task.task.priority === 'do_first' ? 'destructive' : 'default'}
              className="flex items-center gap-1 text-xs"
            >
              <PriorityIcon priority={task.task.priority} className="h-3 w-3" />
              {task.task.priority === 'do_first' ? 'Do First' : 
               task.task.priority === 'do_last' ? 'Do Last' : 
               task.task.priority === 'normal' ? 'Normal' : 'Priority'}
            </Badge>
          )}
          
          {/* Status Badge */}
          <Badge variant="outline" className={`flex items-center gap-1 
            ${currentStatus === 'todo' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 
              currentStatus === 'doing' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' : 
              'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}`}>
            <CheckCircle className="h-3 w-3" />
            {getTaskStatusText(currentStatus)}
          </Badge>
        </div>
        
        <div className="flex justify-between w-full">
          {/* Assignee */}
          {assignee && (
            <div className="flex items-center gap-1">
              <Avatar className="w-6 h-6">
                <AvatarImage src={assignee.avatar_url || ''} />
                <AvatarFallback className="text-xs">{assignee.display_name?.substring(0, 2) || "U"}</AvatarFallback>
              </Avatar>
              <span className="text-xs">{assignee.display_name}</span>
            </div>
          )}
          
          {/* Viewers */}
          {viewers.length > 0 && (
            <AvatarGroup
              viewers={viewers.map(v => ({
                name: v.display_name || 'User',
                imageSrc: v.avatar_url
              }))}
              limit={3}
            />
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default TaskCard; 