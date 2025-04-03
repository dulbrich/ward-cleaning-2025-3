interface UserAvatarProps {
  displayName: string;
  avatarUrl: string;
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