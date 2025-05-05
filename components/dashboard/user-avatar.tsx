interface UserAvatarProps {
  displayName: string;
  avatarUrl: string;
}

interface SessionParticipant {
  id: string;
  temp_user_id?: string;
  user_id?: string;
  [key: string]: any;
}

export function UserAvatar({ displayName, avatarUrl }: UserAvatarProps) {
  // Generate initials from displayName
  const initials = displayName
    .split(' ')
    .map(part => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  
  return (
    <div className="relative h-8 w-8 rounded-full overflow-hidden bg-primary">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${displayName}'s avatar`}
          className="h-full w-full object-cover"
          onError={(e) => {
            // Hide broken image and show initials instead
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : null}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-primary-foreground">
          {initials}
        </span>
      </div>
    </div>
  );
}

export const updateTaskWithFallback = async (
  taskId: string, 
  updateData: Record<string, any>, 
  supabase: any, 
  currentParticipant: SessionParticipant | null
) => {
  try {
    // For guest users, make sure we're updating with the temp user ID
    if (currentParticipant?.temp_user_id && !updateData.assigned_to) {
      // Include the display name and avatar for realtime updates
      const assigneeInfo = currentParticipant ? {
        display_name: currentParticipant.display_name,
        avatar_url: currentParticipant.avatar_url
      } : undefined;
      
      updateData = {
        ...updateData,
        assigned_to_temp_user: currentParticipant.temp_user_id,
        status: updateData.status || "doing",  // Default to "doing" if status not specified
        assigned_at: new Date().toISOString(),
        assignee: assigneeInfo
      };
    }
    
    // Try to update with standard client to trigger real-time events
    const { data, error } = await supabase
      .from('cleaning_session_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select();
    
    if (!error) {
      return { success: true, data, error: null };
    }
    
    console.error('Error updating task:', error);
    return { success: false, data: null, error };
  } catch (err) {
    console.error("Exception updating task:", err);
    return { success: false, data: null, error: err };
  }
}; 