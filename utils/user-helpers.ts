// Helper functions related to user profiles and data

/**
 * Gets the avatar URL for a user, with fallback to default
 */
export function getUserAvatarUrl(profile: any): string {
  if (profile?.avatar_url) {
    return profile.avatar_url;
  }
  
  return "/images/avatar-placeholder.png";
}

/**
 * Gets a display name for a user based on profile or email
 */
export function getUserDisplayName(user: any, profile: any): string {
  if (profile?.full_name) {
    return profile.full_name;
  }
  
  if (user?.email) {
    return user.email.split('@')[0];
  }
  
  return "Unknown User";
}

/**
 * Gets a username for a user based on profile or email
 */
export function getUserUsername(user: any, profile: any): string {
  if (profile?.username) {
    return profile.username;
  }
  
  if (user?.email) {
    return user.email.split('@')[0];
  }
  
  return "unknown";
}

/**
 * Gets user initials for avatar display
 */
export function getUserInitials(user: any, profile: any): string {
  const displayName = getUserDisplayName(user, profile);
  
  if (!displayName || displayName === "Unknown User") {
    return "U";
  }
  
  // For names with multiple parts (first name, last name)
  const nameParts = displayName.split(' ');
  if (nameParts.length > 1) {
    // Get first letter of first and last parts
    return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase();
  }
  
  // For single names or emails, take first two letters
  return displayName.substring(0, 2).toUpperCase();
} 