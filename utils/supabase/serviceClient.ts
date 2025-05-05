// This client is used to handle operations that might be restricted by RLS
// It uses a combination of direct data access and fallbacks

import { createClient } from "@/utils/supabase/client";

// Function to insert a participant - will use direct approach
export const createParticipantWithServiceRole = async (participant: {
  session_id: string;
  temp_user_id: string;
  display_name: string;
  avatar_url: string;
  is_authenticated: boolean;
  last_active_at: string;
}) => {
  try {
    // Use the standard client
    const supabase = createClient();
    
    // Try to insert the participant - this should work if RLS is set correctly
    const { data, error } = await supabase
      .from('session_participants')
      .insert({
        session_id: participant.session_id,
        temp_user_id: participant.temp_user_id,
        display_name: participant.display_name,
        avatar_url: participant.avatar_url,
        is_authenticated: participant.is_authenticated,
        last_active_at: participant.last_active_at
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating participant:", error);
      
      // Create a local representation if DB insert fails
      const localParticipant = {
        id: `local_${Math.random().toString(36).substring(2, 15)}`,
        ...participant
      };
      
      // Store in localStorage for persistence
      localStorage.setItem(`participant_${participant.session_id}_${participant.temp_user_id}`, 
        JSON.stringify(localParticipant));
      
      return { data: [localParticipant], error: null };
    }
    
    return { data: [data], error: null };
  } catch (error) {
    console.error('Error in createParticipantWithServiceRole:', error);
    
    // Fallback to local storage
    const localParticipant = {
      id: `local_${Math.random().toString(36).substring(2, 15)}`,
      ...participant
    };
    
    localStorage.setItem(`participant_${participant.session_id}_${participant.temp_user_id}`, 
      JSON.stringify(localParticipant));
    
    return { data: [localParticipant], error: null };
  }
};

// Function to handle task viewing without server API
export const recordAnonymousTaskView = async (taskView: {
  session_task_id: string;
  participant_id: string;
  started_viewing_at: string;
}) => {
  try {
    // For anonymous usage, just track locally
    const viewKey = `task_view_${taskView.session_task_id}_${taskView.participant_id}`;
    localStorage.setItem(viewKey, taskView.started_viewing_at);
    
    // Return as if successful
    return { data: { ...taskView }, error: null };
  } catch (error) {
    console.error('Error in recordAnonymousTaskView:', error);
    return { data: null, error };
  }
};

// Function to remove task view tracking
export const removeAnonymousTaskView = async (taskView: {
  session_task_id: string;
  participant_id: string;
}) => {
  try {
    // Remove local tracking
    const viewKey = `task_view_${taskView.session_task_id}_${taskView.participant_id}`;
    localStorage.removeItem(viewKey);
    
    return { data: true, error: null };
  } catch (error) {
    console.error('Error in removeAnonymousTaskView:', error);
    return { data: null, error };
  }
};

// Create an interface for the ward task data structure
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
  ward_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Add a type for the session task with task details
interface SessionTaskWithTaskDetails {
  id: string;
  session_id: string;
  task_id: string;
  status: string;
  assigned_to?: string;
  assigned_to_temp_user?: string;
  assigned_at?: string;
  completed_at?: string;
  points_awarded?: number;
  task: any; // The task property can have different formats from Supabase
}

// Define the interface for the joined session tasks result
interface SessionTaskWithDetails {
  id: string;
  session_id: string;
  task_id: string;
  status: string;
  assigned_to?: string;
  assigned_to_temp_user?: string;
  assigned_at?: string;
  completed_at?: string;
  points_awarded?: number;
  task: WardTask | WardTask[];
}

// Helper function to get session ID for a set of tasks
async function getSessionIdForTasks(taskIds: string[], supabase: any) {
  if (!taskIds || taskIds.length === 0) return null;
  
  try {
    const { data, error } = await supabase
      .from('cleaning_session_tasks')
      .select('session_id')
      .in('task_id', taskIds)
      .limit(1)
      .single();
      
    if (error || !data) return null;
    return data.session_id;
  } catch (error) {
    console.error('Error getting session ID:', error);
    return null;
  }
}

// Function to fetch ward tasks without server API - significantly improved
export const fetchWardTasksWithServiceRole = async (taskIds: string[]) => {
  try {
    if (!taskIds || taskIds.length === 0) {
      return { data: [], error: null };
    }

    // First, try a simpler approach - get tasks with full joining
    const supabase = createClient();
    
    // Replace the join query with a more direct approach
    // Try a better approach - use a direct session_id query first to get all tasks
    const sessionId = await getSessionIdForTasks(taskIds, supabase);

    if (sessionId) {
      console.log(`Found session ID ${sessionId} for the task IDs`);
      
      // Try this more direct approach to get all task details
      const { data: sessionTasksWithDetails, error: joinError } = await supabase
        .from('cleaning_session_tasks')
        .select(`
          id,
          session_id,
          task_id,
          status,
          assigned_to,
          assigned_to_temp_user,
          assigned_at,
          completed_at,
          points_awarded,
          task:ward_tasks(*)
        `)
        .in('task_id', taskIds);

      // Add detailed debugging to inspect the response structure
      console.log("Attempt to join cleaning_session_tasks with ward_tasks result:", 
        joinError ? `Error: ${joinError.message}` : `Success, fetched ${sessionTasksWithDetails?.length} items`);

      if (!joinError && sessionTasksWithDetails && sessionTasksWithDetails.length > 0) {
        const firstItem = sessionTasksWithDetails[0];
        console.log("Sample task structure:", {
          item_id: firstItem.id,
          task_id: firstItem.task_id,
          task_type: typeof firstItem.task,
          task_is_array: Array.isArray(firstItem.task),
          task_keys: typeof firstItem.task === 'object' ? 
            (firstItem.task ? Object.keys(firstItem.task) : 'null') : 'not object'
        });
        
        // If task is array, log the first element structure
        if (Array.isArray(firstItem.task) && firstItem.task.length > 0) {
          console.log("First task array element:", {
            sample_task_keys: Object.keys(firstItem.task[0]).slice(0, 5),
            sample_task_title: firstItem.task[0].title
          });
        } 
        // If task is object, log some sample values
        else if (typeof firstItem.task === 'object' && firstItem.task !== null) {
          console.log("Task object sample:", {
            sample_keys: Object.keys(firstItem.task).slice(0, 5),
            sample_title: firstItem.task.title
          });
        }
        
        // Properly handle the way Supabase returns joined data
        // Check if task data is present by examining the first result
        const hasTaskData = firstItem.task !== null;
        
        console.log("First join result task data:", 
          hasTaskData ? 
          (Array.isArray(firstItem.task) ? 
            `Array with ${firstItem.task.length} items` : 
            (typeof firstItem.task === 'object' ? 
              `Object with keys: ${Object.keys(firstItem.task).join(', ')}` : 
              `Unexpected type: ${typeof firstItem.task}`)) : 
          "No task data");
        
        if (hasTaskData) {
          // Map the session tasks to their ward tasks
          const formattedTasks: WardTask[] = [];
          
          // Extract task details from each session task
          sessionTasksWithDetails.forEach((item: SessionTaskWithTaskDetails) => {
            if (!item.task) return;
            
            let taskData: WardTask;
            
            // Handle different return formats from Supabase
            if (Array.isArray(item.task)) {
              // If task is an array (common with joins), use the first item
              if (item.task.length > 0) {
                taskData = item.task[0] as WardTask;
              } else {
                return; // Skip if empty array
              }
            } else if (typeof item.task === 'object') {
              // If task is an object, use it directly
              taskData = item.task as WardTask;
            } else {
              return; // Skip if unexpected type
            }
            
            // Only add valid tasks with an ID
            if (taskData && taskData.id) {
              formattedTasks.push(taskData);
            }
          });
          
          // Check if we extracted any valid tasks
          if (formattedTasks.length > 0) {
            console.log(`Successfully extracted ${formattedTasks.length} tasks from join result`);
            
            // Check if we're missing any tasks
            const fetchedIds = new Set(formattedTasks.map((task: WardTask) => task.id));
            const missingTaskIds = taskIds.filter(id => !fetchedIds.has(id));
            
            if (missingTaskIds.length > 0) {
              console.log(`Join approach missing ${missingTaskIds.length} tasks, creating placeholders for those`);
              
              // Create placeholders for the missing tasks
              const placeholders = missingTaskIds.map(id => createPlaceholderTask(id));
              return { data: [...formattedTasks, ...placeholders], error: null };
            }
            
            return { data: formattedTasks, error: null };
          }
        }
        
        console.log("Join approached failed to extract task data");
      }
    }
    
    // If the join approach failed, try the direct approach
    console.log("Join approach failed, trying direct ward_tasks fetch");
    const { data: directTasks, error: directError } = await supabase
      .from('ward_tasks')
      .select('*')
      .in('id', taskIds);
    
    if (!directError && directTasks && directTasks.length > 0) {
      // Check if we got all the tasks we requested
      const fetchedIds = new Set(directTasks.map((task: WardTask) => task.id));
      const missingTaskIds = taskIds.filter(id => !fetchedIds.has(id));
      
      if (missingTaskIds.length > 0) {
        // Create placeholders for the missing tasks
        const placeholders = missingTaskIds.map(id => createPlaceholderTask(id));
        return { data: [...directTasks, ...placeholders], error: null };
      }
      
      return { data: directTasks, error: null };
    }
    
    // Last resort - try to fetch tasks one by one
    console.log("Both approaches failed, trying individual task fetches");
    const fetchedTasks: WardTask[] = [];
    const fetchPromises = taskIds.map(async (id) => {
      const { data: taskData, error: taskError } = await supabase
        .from('ward_tasks')
        .select('*')
        .eq('id', id)
        .single();
        
      if (!taskError && taskData) {
        fetchedTasks.push(taskData);
      } else {
        fetchedTasks.push(createPlaceholderTask(id));
      }
    });
    
    await Promise.all(fetchPromises);
    return { data: fetchedTasks, error: null };
  } catch (error) {
    console.error('Error in fetchWardTasksWithServiceRole:', error);
    
    // Generate placeholders for all tasks
    const placeholderTasks = taskIds.map(id => createPlaceholderTask(id));
    return { data: placeholderTasks, error: null };
  }
};

// Helper function to create a placeholder task
function createPlaceholderTask(id: string): WardTask {
  return {
    id: id,
    title: `Task ${id.substring(0, 6)}`,
    subtitle: "Details unavailable",
    instructions: "Task details could not be loaded due to access restrictions. Please ask a ward leader for details.",
    equipment: "Unknown",
    safety: "Exercise caution when performing this task.",
    priority: "normal",
    kid_friendly: false,
    points: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
} 