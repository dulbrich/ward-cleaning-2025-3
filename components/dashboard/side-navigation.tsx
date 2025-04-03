"use client";

import { UserAvatar } from "@/components/dashboard/user-avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SideNavigationProps {
  expanded: boolean;
  toggleExpanded: () => void;
  isMobile: boolean;
  mobileOpen: boolean;
  closeMobileNav: () => void;
  pathname: string;
  displayName: string;
  username: string;
  avatarUrl: string;
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  expanded: boolean;
  badge?: {
    content: string | number;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  newFeature?: boolean;
}

// Individual navigation item
function NavItem({ href, icon, label, active, expanded, badge, newFeature }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-11 items-center rounded-md px-3 text-sm font-medium transition-colors",
        active 
          ? "bg-primary/20 text-primary-foreground" 
          : "text-muted-foreground hover:bg-primary/10 hover:text-white",
        !expanded && "justify-center"
      )}
    >
      <span className={cn("mr-3", !expanded && "mr-0")}>{icon}</span>
      {expanded && <span>{label}</span>}
      
      {expanded && badge && (
        <Badge 
          variant={badge.variant || "default"} 
          className="ml-auto"
        >
          {badge.content}
        </Badge>
      )}
      
      {!expanded && badge && (
        <Badge 
          variant={badge.variant || "default"} 
          className="absolute right-2 top-1 h-5 w-5 p-0 flex items-center justify-center"
        >
          {typeof badge.content === 'number' && badge.content > 99 ? '99+' : badge.content}
        </Badge>
      )}
      
      {expanded && newFeature && (
        <span className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-sm">New</span>
      )}
    </Link>
  );
}

// Section header
function SectionHeader({ label, expanded }: { label: string; expanded: boolean }) {
  if (!expanded) return null;
  
  return (
    <div className="px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground tracking-wider">
        {label}
      </p>
    </div>
  );
}

export default function SideNavigation({ 
  expanded, 
  toggleExpanded,
  isMobile,
  mobileOpen,
  closeMobileNav,
  pathname,
  displayName,
  username,
  avatarUrl
}: SideNavigationProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40" 
          onClick={closeMobileNav}
        ></div>
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 h-full z-40
          sidebar-nav border-r 
          transition-all duration-300 ease-in-out
          ${expanded ? 'w-[250px]' : 'w-16'}
          ${isMobile ? (mobileOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div className="h-14 flex items-center px-4 border-b border-slate-800">
          <a 
            href="/protected" 
            className={`flex items-center ${expanded ? 'justify-between w-full' : 'justify-center'}`}
          >
            {expanded ? (
              <>
                <span className="text-xl font-bold text-white">Ward Cleaning</span>
                {!isMobile && (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      toggleExpanded();
                    }}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </>
            ) : (
              <>
                {!isMobile && (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      toggleExpanded();
                    }}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </a>
        </div>
        
        {/* Navigation Links */}
        <nav className="py-4 overflow-y-auto h-[calc(100%-60px)]">
          <ul className="space-y-1 px-2">
            {/* Dashboard Link */}
            <li>
              <a
                href="/protected"
                className={`
                  flex items-center rounded-md px-2 py-2 text-sm
                  ${pathname === '/protected' 
                    ? 'bg-primary text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                {expanded && <span className="ml-3">Dashboard</span>}
              </a>
            </li>
            
            {/* Assignments Link */}
            <li>
              <a
                href="/protected/assignments"
                className={`
                  flex items-center rounded-md px-2 py-2 text-sm
                  ${pathname.startsWith('/protected/assignments') 
                    ? 'bg-primary text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                {expanded && (
                  <div className="ml-3 flex items-center justify-between w-full">
                    <span>Assignments</span>
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white text-xs rounded-full ml-1">3</span>
                  </div>
                )}
                {!expanded && (
                  <span className="absolute left-11 top-1.5 inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white text-xs rounded-full">3</span>
                )}
              </a>
            </li>
            
            {/* Schedule Link */}
            <li>
              <a
                href="/protected/schedule"
                className={`
                  flex items-center rounded-md px-2 py-2 text-sm
                  ${pathname.startsWith('/protected/schedule') 
                    ? 'bg-primary text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                {expanded && <span className="ml-3">Schedule</span>}
              </a>
            </li>
            
            {/* My Stats Link */}
            <li>
              <a
                href="/protected/stats"
                className={`
                  flex items-center rounded-md px-2 py-2 text-sm
                  ${pathname.startsWith('/protected/stats') 
                    ? 'bg-primary text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                {expanded && (
                  <div className="ml-3 flex items-center justify-between w-full">
                    <span>My Stats</span>
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded bg-slate-700 text-white">New</span>
                  </div>
                )}
                {!expanded && (
                  <span className="absolute left-11 top-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded bg-slate-700 text-white">New</span>
                )}
              </a>
            </li>
            
            {/* Leaderboard Link */}
            <li>
              <a
                href="/protected/leaderboard"
                className={`
                  flex items-center rounded-md px-2 py-2 text-sm
                  ${pathname.startsWith('/protected/leaderboard') 
                    ? 'bg-primary text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
                {expanded && <span className="ml-3">Leaderboard</span>}
              </a>
            </li>
            
            {/* Admin Section */}
            {expanded && <div className="pt-4 pb-2 px-4 text-xs font-medium text-slate-400 uppercase">Admin</div>}
            
            {/* Messenger Link */}
            <li>
              <a
                href="/protected/messenger"
                className={`
                  flex items-center rounded-md px-2 py-2 text-sm
                  ${pathname.startsWith('/protected/messenger') 
                    ? 'bg-primary text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
                {expanded && <span className="ml-3">Messenger</span>}
              </a>
            </li>
            
            {/* Campaigns Link */}
            <li>
              <a
                href="/protected/campaigns"
                className={`
                  flex items-center rounded-md px-2 py-2 text-sm
                  ${pathname.startsWith('/protected/campaigns') 
                    ? 'bg-primary text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9l1.293-1.293zM11.293 8.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L12.586 12l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {expanded && <span className="ml-3">Campaigns</span>}
              </a>
            </li>
            
            {/* Contacts Link */}
            <li>
              <a
                href="/protected/contacts"
                className={`
                  flex items-center rounded-md px-2 py-2 text-sm
                  ${pathname.startsWith('/protected/contacts') 
                    ? 'bg-primary text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                {expanded && <span className="ml-3">Contacts</span>}
              </a>
            </li>
            
            {/* Scheduler Link */}
            <li>
              <a
                href="/protected/scheduler"
                className={`
                  flex items-center rounded-md px-2 py-2 text-sm
                  ${pathname.startsWith('/protected/scheduler') 
                    ? 'bg-primary text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {expanded && <span className="ml-3">Scheduler</span>}
              </a>
            </li>
            
            {/* Reports Link */}
            <li>
              <a
                href="/protected/reports"
                className={`
                  flex items-center rounded-md px-2 py-2 text-sm
                  ${pathname.startsWith('/protected/reports') 
                    ? 'bg-primary text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm4-1a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm4-1a1 1 0 10-2 0v3a1 1 0 102 0v-3z" clipRule="evenodd" />
                </svg>
                {expanded && <span className="ml-3">Reports</span>}
              </a>
            </li>
            
            {/* Assignment Builder Link */}
            <li>
              <a
                href="/protected/assignment-builder"
                className={`
                  flex items-center rounded-md px-2 py-2 text-sm
                  ${pathname.startsWith('/protected/assignment-builder') 
                    ? 'bg-primary text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
                {expanded && <span className="ml-3">Assignment Builder</span>}
              </a>
            </li>
            
            {/* Settings Link */}
            <li>
              <a
                href="/protected/settings"
                className={`
                  flex items-center rounded-md px-2 py-2 text-sm
                  ${pathname.startsWith('/protected/settings') 
                    ? 'bg-primary text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                {expanded && <span className="ml-3">Settings</span>}
              </a>
            </li>
          </ul>
        </nav>
        
        {/* User Profile - Bottom of Sidebar */}
        {expanded && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800 p-2">
            <a 
              href="/protected/profile"
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-800"
            >
              <UserAvatar displayName={displayName} avatarUrl={avatarUrl} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-xs text-slate-400 truncate">@{username.split('@')[0]}</p>
              </div>
            </a>
          </div>
        )}
      </aside>
    </>
  );
} 