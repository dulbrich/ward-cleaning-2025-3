"use client";

import SideNavigation from "@/components/dashboard/side-navigation";
import TopNavBar from "@/components/dashboard/top-nav-bar";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Helper function to get page title from pathname
 */
function getPageTitle(pathname: string): string {
  // Remove "/protected" prefix and trailing slash
  const path = pathname.replace(/^\/protected\/?/, "");
  
  if (path === "") return "Dashboard";
  
  // Convert kebab-case to Title Case
  return path
    .split("/")[0]
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface DashboardClientProps {
  displayName: string;
  username: string;
  avatarUrl: string;
  children: React.ReactNode;
}

export default function DashboardClient({ 
  displayName, 
  username, 
  avatarUrl,
  children 
}: DashboardClientProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  
  useEffect(() => {
    // Check if mobile on initial load
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      // On mobile, collapse sidebar by default
      if (window.innerWidth < 1024) {
        setSidebarExpanded(false);
      }
    };
    
    // Check initially
    checkIfMobile();
    
    // Add resize listener
    window.addEventListener("resize", checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);
  
  // Close mobile nav on pathname change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);
  
  // Toggle mobile nav
  const toggleMobileNav = () => {
    setMobileOpen(prev => !prev);
  };
  
  // Toggle expanded sidebar (desktop)
  const toggleExpanded = () => {
    setSidebarExpanded(prev => !prev);
  };
  
  // Close mobile nav
  const closeMobileNav = () => {
    setMobileOpen(false);
  };
  
  return (
    <div className="flex h-screen w-full bg-[#111827] text-white">
      {/* Sidebar */}
      <SideNavigation 
        expanded={sidebarExpanded}
        toggleExpanded={toggleExpanded}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        closeMobileNav={closeMobileNav}
        pathname={pathname}
        displayName={displayName}
        username={username}
        avatarUrl={avatarUrl}
      />
      
      {/* Main Content Area */}
      <div className={`flex flex-col flex-grow overflow-hidden ${
        isMobile ? "w-full" : (sidebarExpanded ? "ml-[250px]" : "ml-16")
      }`}>
        {/* Top Navigation */}
        <TopNavBar 
          isMobile={isMobile}
          mobileOpen={mobileOpen}
          toggleMobileNav={toggleMobileNav}
          displayName={displayName}
          username={username}
          avatarUrl={avatarUrl}
        />
        
        {/* Page Content */}
        <main className="flex-grow overflow-auto bg-[#0f172a]">
          {children}
        </main>
      </div>
    </div>
  );
} 