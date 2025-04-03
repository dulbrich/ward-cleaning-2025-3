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
import {
    BarChart3,
    Bell,
    BookOpen,
    Calendar,
    ChevronLeft,
    ChevronRight,
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
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | null;
  active?: boolean;
};

export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // Check screen size on component mount and window resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 1024) {
        setIsSidebarExpanded(false);
      }
    };

    // Initial check
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener("resize", checkScreenSize);

    // Clean up
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

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
      active: pathname === "/app/stats",
      badge: 2
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
      active: pathname === "/app/tasks",
      badge: 3
    }
  ];

  // Admin section navigation items
  const adminItems: NavItem[] = [
    {
      title: "Messenger",
      href: "/app/messenger",
      icon: <MessageSquare size={24} />,
      active: pathname === "/app/messenger",
      badge: 5
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
      active: pathname === "/app/schedule",
      badge: 1
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
      title: "Settings",
      href: "/app/settings",
      icon: <Settings size={24} />,
      active: pathname === "/app/settings"
    },
    {
      title: "Docs",
      href: "/app/docs",
      icon: <BookOpen size={24} />,
      active: pathname === "/app/docs"
    }
  ];

  // Render a navigation item
  const renderNavItem = (item: NavItem) => (
    <Link
      href={item.href}
      key={item.href}
      className={`
        flex items-center px-3 py-3 rounded-md text-sm font-medium
        transition-colors duration-150 ease-in-out
        ${item.active 
          ? 'bg-primary/10 text-primary' 
          : 'text-foreground/70 hover:bg-muted hover:text-foreground'}
        ${isSidebarExpanded ? 'justify-start' : 'justify-center'}
      `}
    >
      <span className="relative">
        {item.icon}
        {item.badge && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {item.badge}
          </span>
        )}
      </span>
      {isSidebarExpanded && <span className="ml-3">{item.title}</span>}
    </Link>
  );

  // Component for the mobile sidebar overlay
  const MobileSidebarOverlay = () => (
    <>
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );

  // Main layout structure
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 h-[60px] md:h-[60px]">
        <div className="flex h-full items-center px-4">
          {/* Left side: Menu toggle, Logo & Page Title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu size={24} />
              <span className="sr-only">Toggle menu</span>
            </Button>

            <Link href="/app" className="flex items-center gap-2">
              <Image 
                src="/images/logo.png" 
                alt="Ward Cleaning Logo" 
                width={32} 
                height={32}
                className="rounded-md"
              />
              <span className="font-medium text-lg hidden sm:inline-block">
                Ward Cleaning
              </span>
            </Link>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side: Notification, Theme, Settings, User Profile */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell size={20} className="text-muted-foreground" />
            </Button>
            
            <ThemeSwitcher />
            
            <Button variant="ghost" size="icon">
              <Cog size={20} className="text-muted-foreground" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs font-medium">JD</span>
                  </div>
                  <span className="font-medium text-sm hidden md:inline-block">John Doe</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium">John Doe</p>
                  <p className="text-xs text-muted-foreground">john.doe@example.com</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/app/profile" className="cursor-pointer">
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
      <MobileSidebarOverlay />

      {/* Sidebar Navigation */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-40
          flex flex-col bg-card border-r shadow-sm
          transition-all duration-200 ease-out
          ${isSidebarOpen || !isMobile ? 'translate-x-0' : '-translate-x-full'}
          ${isSidebarExpanded ? 'w-60' : 'w-16'}
          top-[60px] md:top-[60px]
        `}
      >
        {/* Sidebar Header with Toggle Button */}
        <div className="flex items-center justify-end p-2 border-b h-12">
          {!isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="h-8 w-8"
            >
              {isSidebarExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </Button>
          )}
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(false)}
              className="h-8 w-8 md:hidden"
            >
              <X size={18} />
            </Button>
          )}
        </div>
          
        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          {/* Members Section */}
          <div className="mb-6">
            {isSidebarExpanded && (
              <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                Members
              </h3>
            )}
            <div className="space-y-1">
              {memberItems.map(renderNavItem)}
            </div>
          </div>
          
          {/* Admin Section */}
          <div>
            {isSidebarExpanded && (
              <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                Admin
              </h3>
            )}
            <div className="space-y-1">
              {adminItems.map(renderNavItem)}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={`
          mt-[60px] pt-6 pb-12 px-4 md:px-6
          transition-all duration-200 ease-out
          ${isSidebarExpanded ? 'md:ml-60' : 'md:ml-16'}
        `}
      >
        <div className="mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}