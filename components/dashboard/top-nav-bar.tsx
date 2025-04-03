"use client";

import { UserAvatar } from "@/components/dashboard/user-avatar";
import { getUserInitials } from "@/utils/user-helpers";
import { useState } from "react";

interface TopNavBarProps {
  isMobile: boolean;
  mobileOpen: boolean;
  toggleMobileNav: () => void;
  displayName: string;
  username: string;
  avatarUrl: string;
}

export default function TopNavBar({
  isMobile,
  mobileOpen,
  toggleMobileNav,
  displayName,
  username,
  avatarUrl
}: TopNavBarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [error, setError] = useState(false);
  
  // Get initials for avatar fallback
  const initials = getUserInitials({ email: username }, { full_name: displayName });

  return (
    <header className="flex items-center justify-between h-14 bg-[#111827] border-b border-slate-800 px-4">
      {/* Logo & Mobile Menu Button */}
      <div className="flex items-center">
        {isMobile && (
          <button 
            onClick={toggleMobileNav}
            className="mr-2 p-2 rounded-md hover:bg-slate-800"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        )}
        
        <a href="/protected" className="lg:hidden flex items-center">
          <span className="text-xl font-bold text-white">Ward Cleaning</span>
        </a>
      </div>
      
      {/* Search */}
      <div className="hidden md:flex flex-1 mx-4 max-w-md">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 pl-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* User Actions */}
      <div className="flex items-center space-x-3">
        <button className="p-2 rounded-md hover:bg-slate-800" aria-label="Notifications">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        </button>
        
        <button className="p-2 rounded-md hover:bg-slate-800" aria-label="Settings">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>
        
        <div className="relative group">
          <button className="flex items-center focus:outline-none hover:bg-slate-800 p-1 rounded-md">
            <UserAvatar displayName={displayName} avatarUrl={avatarUrl} />
            <span className="hidden sm:block ml-2 text-sm">{displayName}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
            <a href="/protected/profile" className="block px-4 py-2 text-sm hover:bg-slate-800">Your Profile</a>
            <a href="/protected/settings" className="block px-4 py-2 text-sm hover:bg-slate-800">Settings</a>
            <div className="border-t border-slate-800 my-1"></div>
            <form action="/auth/sign-out" method="post" className="w-full">
              <button type="submit" className="w-full text-left block px-4 py-2 text-sm hover:bg-slate-800">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
} 