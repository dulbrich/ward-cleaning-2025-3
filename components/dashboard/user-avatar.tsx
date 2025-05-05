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
    // Try to update with standard client first to trigger real-time events
    const { error } = await supabase
      .from('cleaning_session_tasks')
      .update(updateData)
      .eq('id', taskId);
    
    if (!error) {
      // Success with standard client
      return { success: true, error: null };
    }
    
    // If standard client fails and we have a temp user, fallback to a method
    // that will trigger real-time updates
    if (currentParticipant?.temp_user_id) {
      // This approach uses a more permissive RLS policy that exists
      const { error: fallbackError } = await supabase
        .from('cleaning_session_tasks')
        .update({
          ...updateData,
          assigned_to_temp_user: currentParticipant.temp_user_id
        })
        .eq('id', taskId);
      
      if (!fallbackError) {
        return { success: true, error: null };
      }
      
      return { success: false, error: fallbackError };
    }
    
    return { success: false, error };
  } catch (err) {
    console.error("Error updating task:", err);
    return { success: false, error: err };
  }
}; 