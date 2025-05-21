"use client";

import { signOutAction } from "@/app/actions";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useUserProfile } from "@/hooks/useUserProfile";
import { createClient } from "@/utils/supabase/client";
import {
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  ClipboardList,
  Cog,
  FileText,
  Home,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Settings,
  Trophy,
  Users,
  Wrench,
  X
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function getUserGroup(lastName?: string): string | null {
  if (!lastName) return null;
  const letter = lastName.charAt(0).toUpperCase();
  if (letter >= "A" && letter <= "F") return "A";
  if (letter >= "G" && letter <= "L") return "B";
  if (letter >= "M" && letter <= "R") return "C";
  if (letter >= "S" && letter <= "Z") return "D";
  return null;
}

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | null;
  active?: boolean;
};

// Component for the mobile sidebar overlay
const MobileSidebarOverlayComponent = ({ isMobile, isSidebarOpen, setIsSidebarOpen }: { 
  isMobile: boolean; 
  isSidebarOpen: boolean; 
  setIsSidebarOpen: (open: boolean) => void; 
}) => (
  <>
    {isMobile && isSidebarOpen && (
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={() => setIsSidebarOpen(false)}
      />
    )}
  </>
);

// Dynamically import heavy components
const MobileSidebarOverlay = dynamic(() => 
  Promise.resolve(MobileSidebarOverlayComponent)
, { ssr: false });

export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showScrollbar, setShowScrollbar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [calendarCount, setCalendarCount] = useState<number | null>(null);
  const [todoCount, setTodoCount] = useState<number | null>(null);
  const expandTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const { profile, loading } = useUserProfile();
  const isAdmin = profile?.role?.toLowerCase() === "admin";

  // Check screen size on component mount and window resize
  useEffect(() => {
    const checkScreenSize = () => {
      const mobileView = window.innerWidth < 768;
      setIsMobile(mobileView);
      
      // Close sidebar automatically when switching to mobile view
      if (mobileView) {
        setIsSidebarOpen(false);
      }
    };

    // Initial check
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener("resize", checkScreenSize);

    // Clean up
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Helper to determine sidebar expansion state
  // On mobile, always show the sidebar expanded when visible so text labels are displayed
  const sidebarIsExpanded = isMobile ? true : (isSidebarExpanded || isHovering);

  // Handle hover with delayed scrollbar appearance
  const handleMouseEnter = () => {
    if (isMobile) return;
    
    setIsHovering(true);
    
    // Clear any existing timers
    if (expandTimerRef.current) {
      clearTimeout(expandTimerRef.current);
    }
    
    // Delay showing the scrollbar until after the expansion animation completes
    expandTimerRef.current = setTimeout(() => {
      setShowScrollbar(true);
    }, 200); // Match this to the transition duration
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    
    setIsHovering(false);
    setShowScrollbar(false);
    
    // Clear any pending timers
    if (expandTimerRef.current) {
      clearTimeout(expandTimerRef.current);
      expandTimerRef.current = null;
    }
  };

  // Always enable scrolling on mobile when the sidebar is open
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      setShowScrollbar(true);
    } else if (isMobile) {
      setShowScrollbar(false);
    }
  }, [isMobile, isSidebarOpen]);

  // Fetch badge counts for calendar and tasks
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const supabase = createClient();
        const today = new Date().toISOString().split("T")[0];

        // Cleaning calendar count
        if (profile) {
          const { data: scheduleData, error } = await supabase
            .from("cleaning_schedules")
            .select("id, assigned_group")
            .gte("cleaning_date", today);

          if (!error && scheduleData) {
            const group = getUserGroup(profile.last_name);
            const filtered = scheduleData.filter((ev: any) => {
              if (ev.assigned_group === "All") return true;
              if (!group) return true;
              return ev.assigned_group === group;
            });
            setCalendarCount(filtered.length);
          }
        }

        // Tasks count for next session
        const { data: session, error: sessionErr } = await supabase
          .from("cleaning_sessions")
          .select("id, session_date")
          .gte("session_date", today)
          .order("session_date")
          .limit(1)
          .maybeSingle();

        if (!sessionErr && session) {
          const { count, error: taskErr } = await supabase
            .from("cleaning_session_tasks")
            .select("id", { count: "exact", head: true })
            .eq("session_id", session.id)
            .eq("status", "todo");
          if (!taskErr) {
            setTodoCount(count ?? 0);
          }
        }
      } catch (err) {
        console.error("Error fetching sidebar counts", err);
      }
    };

    if (!loading) {
      fetchCounts();
    }
  }, [loading, profile]);

  // Member section navigation items
  const memberItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/app",
      icon: <Home size={24} />,
      active: pathname === "/app"
    },
    {
      title: "My Stats",
      href: "/app/stats",
      icon: <BarChart3 size={24} />,
      active: pathname === "/app/stats"
    },
    {
      title: "Leader Board",
      href: "/app/leaderboard",
      icon: <Trophy size={24} />,
      active: pathname === "/app/leaderboard"
    },
    {
      title: "Tasks",
      href: "/app/tasks",
      icon: <ClipboardList size={24} />,
      active: pathname?.startsWith("/app/tasks") ?? false,
      badge: todoCount ?? undefined
    },
    {
      title: "Cleaning Calendar",
      href: "/app/calendar",
      icon: <Calendar size={24} />,
      active: pathname === "/app/calendar",
      badge: calendarCount ?? undefined
    }
  ];

  // Admin section navigation items
  const adminItems: NavItem[] = [
    {
      title: "Messenger",
      href: "/app/messenger",
      icon: <MessageSquare size={24} />,
      active: pathname === "/app/messenger"
    },
    {
      title: "Campaigns",
      href: "/app/campaigns",
      icon: <Megaphone size={24} />,
      active: pathname === "/app/campaigns"
    },
    {
      title: "Contacts",
      href: "/app/contacts",
      icon: <Users size={24} />,
      active: pathname === "/app/contacts"
    },
    {
      title: "Schedule",
      href: "/app/schedule",
      icon: <Calendar size={24} />,
      active: pathname === "/app/schedule"
    },
    {
      title: "Reporting",
      href: "/app/reporting",
      icon: <FileText size={24} />,
      active: pathname === "/app/reporting"
    },
    {
      title: "Tools",
      href: "/app/tools",
      icon: <Wrench size={24} />,
      active: pathname === "/app/tools"
    },
    {
      title: "Docs",
      href: "/app/docs",
      icon: <BookOpen size={24} />,
      active: pathname === "/app/docs"
    }
  ];

  const settingsItem: NavItem = {
    title: "Settings",
    href: "/app/settings",
    icon: <Settings size={24} />,
    active: pathname === "/app/settings"
  };

  if (isAdmin) {
    adminItems.push(settingsItem);
  } else {
    memberItems.push(settingsItem);
  }

  // Render a navigation item
  const renderNavItem = (item: NavItem) => (
    <Link
      href={item.href}
      key={item.href}
      className={`
        flex items-center rounded-md text-sm font-medium
        transition-colors duration-150 ease-in-out
        ${item.active 
          ? 'bg-primary/10 text-primary' 
          : 'text-foreground/70 hover:bg-muted hover:text-foreground'}
        h-11 relative
      `}
      prefetch={true}
    >
      <div className="w-16 flex justify-center items-center flex-shrink-0">
        <span className="relative">
          {item.icon}
          {item.badge && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {item.badge}
            </span>
          )}
        </span>
      </div>
      <span 
        className={`
          whitespace-nowrap transition-opacity duration-200 overflow-hidden
          ${sidebarIsExpanded ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}
        `}
      >
        {item.title}
      </span>
    </Link>
  );

  // Create a custom scrollbar style class
  const scrollbarClass = `
    scrollbar-container
    ${showScrollbar ? 'overflow-y-auto' : 'overflow-hidden'}
  `;

  // Main layout structure
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 h-[60px] w-full">
        <div className="flex h-full items-center px-2 sm:px-4">
          {/* Left side: Menu toggle, Logo & Page Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu size={22} />
              <span className="sr-only">Toggle menu</span>
            </Button>

            <Link href="/app" className="flex items-center gap-1 sm:gap-2">
              <Image 
                src="/images/logo.png" 
                alt="Ward Cleaning Logo" 
                width={28}
                height={28}
                className="rounded-md"
              />
              <span className="font-medium text-base lg:text-lg hidden sm:inline-block truncate">
                Ward Cleaning
              </span>
            </Link>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side: Notification, Theme, Settings, User Profile */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
              <Bell size={18} className="text-muted-foreground" />
            </Button>
            
            <ThemeSwitcher />
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
              asChild
            >
              <Link href="/app/settings">
                <Cog size={18} className="text-muted-foreground" />
                <span className="sr-only">Settings</span>
              </Link>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-1 sm:px-2">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url.startsWith('/') ? profile.avatar_url : `/images/avatars/${profile.avatar_url}`}
                      alt={`${profile.first_name} ${profile.last_name}`}
                      width={32}
                      height={32}
                      className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {profile ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}` : 'JD'}
                      </span>
                    </div>
                  )}
                  <span className="font-medium text-sm hidden md:inline-block">
                    {profile ? `${profile.first_name} ${profile.last_name}` : 'John Doe'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium">
                    {profile ? `${profile.first_name} ${profile.last_name}` : 'John Doe'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.username || 'john.doe@example.com'}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/app/settings" className="cursor-pointer">
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/account" className="cursor-pointer">
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={signOutAction}>
                  <Button 
                    type="submit" 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start px-2 text-destructive hover:text-destructive"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign out
                  </Button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <MobileSidebarOverlay isMobile={isMobile} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      {/* Sidebar Navigation */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50
          flex flex-col bg-card border-r shadow-sm
          transition-all duration-200 ease-out
          ${isMobile 
            ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full') 
            : 'translate-x-0'
          }
          ${sidebarIsExpanded ? 'w-60' : 'w-16'}
          top-[60px] md:top-[60px]
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Mobile only - Sidebar Header with Close Button */}
        {isMobile && (
          <div className="flex items-center justify-end p-2 border-b h-12">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(false)}
              className="h-8 w-8 md:hidden"
            >
              <X size={18} />
            </Button>
          </div>
        )}
          
        {/* Sidebar Content */}
        <div className={`flex-1 py-4 ${scrollbarClass}`}>
          {/* Members Section */}
          <div className="mb-6 relative">
            <div className={`
              transition-opacity duration-200 h-6 px-4 mb-2
              ${sidebarIsExpanded ? 'opacity-100' : 'opacity-0'}
            `}>
              <h3 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                Members
              </h3>
            </div>
            <div className="space-y-1">
              {memberItems.map(renderNavItem)}
            </div>
          </div>
          
          {isAdmin && (
            <div className="relative">
              <div className={`
                transition-opacity duration-200 h-6 px-4 mb-2
                ${sidebarIsExpanded ? 'opacity-100' : 'opacity-0'}
              `}>
                <h3 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                  Admin
                </h3>
              </div>
              <div className="space-y-1">
                {adminItems.map(renderNavItem)}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={`
          mt-[60px] pt-4 pb-8 sm:pt-6 sm:pb-12
          transition-all duration-200 ease-out
          overflow-x-hidden w-full flex justify-center
          ${isMobile 
            ? 'px-3 sm:px-4' 
            : (isSidebarExpanded || isHovering 
                ? 'md:pl-64 px-4 md:pr-6' 
                : 'md:pl-20 px-4 md:pr-6')
          }
        `}
      >
        <div className="w-full max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
}