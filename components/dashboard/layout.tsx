import DashboardClient from "@/components/client-components/dashboard-client";
import { getUserAvatarUrl, getUserDisplayName, getUserUsername } from "@/utils/user-helpers";

interface UserProfile {
  id: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  role?: string;
  [key: string]: any;
}

interface User {
  id: string;
  email?: string;
  [key: string]: any;
}

interface DashboardLayoutProps {
  user: User;
  profile: UserProfile;
  children: React.ReactNode;
}

export default function DashboardLayout({
  user,
  profile,
  children
}: DashboardLayoutProps) {
  // Get user display information using helper functions
  const displayName = getUserDisplayName(user, profile);
  const username = getUserUsername(user, profile);
  const avatarUrl = getUserAvatarUrl(profile);
  const isAdmin = profile?.role?.toLowerCase() === "admin";

  return (
    <DashboardClient
      displayName={displayName}
      username={username}
      avatarUrl={avatarUrl}
      isAdmin={isAdmin}
    >
      {children}
    </DashboardClient>
  );
}
