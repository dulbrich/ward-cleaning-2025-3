"use client";

import { useEffect, useState } from "react";
import { ProfileForm } from "./profile-form";

// Define user profile interface
interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone_number: string;
  is_phone_verified: boolean;
  avatar_url: string;
  role: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Profile");
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch actual user data on component mount
  useEffect(() => {
    async function fetchUserData() {
      try {
        // Try to fetch user profile from the API
        console.log("Fetching user profile data...");
        const response = await fetch('/api/user/profile');
        
        if (response.ok) {
          const data = await response.json();
          console.log("Successfully loaded user data:", data);
          setUserData(data);
        } else {
          console.error("Error fetching profile:", response.status, response.statusText);
          try {
            const errorText = await response.text();
            console.error("Error response:", errorText);
          } catch (e) {
            console.error("Could not read error response");
          }
          
          // Fallback to mock data if API fails
          setUserData({
            id: "user_123",
            first_name: "Default",
            last_name: "User",
            username: "defaultuser",
            email: "default.user@example.com",
            phone_number: "(555) 123-4567",
            is_phone_verified: true,
            avatar_url: "/images/avatars/default.png",
            role: "user"
          });
        }
      } catch (error) {
        console.error("Exception fetching user data:", error);
        // Use fallback data on error
        setUserData({
          id: "user_123",
          first_name: "Default",
          last_name: "User",
          username: "defaultuser",
          email: "default.user@example.com",
          phone_number: "(555) 123-4567",
          is_phone_verified: true,
          avatar_url: "/images/avatars/default.png",
          role: "user"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  const tabs = [
    { name: 'Profile', active: activeTab === 'Profile' },
    { name: 'Account', active: activeTab === 'Account' },
    { name: 'Notifications', active: activeTab === 'Notifications' },
    { name: 'Preferences', active: activeTab === 'Preferences' },
    { name: 'Privacy', active: activeTab === 'Privacy' },
    { name: 'Security', active: activeTab === 'Security' },
    { name: 'Connected Services', active: activeTab === 'Connected Services' },
    { name: 'Admin Options', active: activeTab === 'Admin Options' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings Navigation */}
        <div className="md:col-span-1">
          <nav className="bg-card rounded-lg border overflow-hidden">
            <div className="p-2">
              {tabs.map((item, i) => (
                <button 
                  key={i} 
                  className={`w-full text-left px-3 py-2 rounded-md ${item.active ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                  onClick={() => setActiveTab(item.name)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </nav>
        </div>
        
        {/* Settings Content */}
        <div className="md:col-span-2 space-y-6">
          {activeTab === 'Profile' && (
            <div className="bg-card rounded-lg border p-6">
              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ProfileForm userData={userData} />
              )}
            </div>
          )}
          
          {activeTab === 'Notifications' && (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-medium mb-4">Notification Preferences</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">Receive updates about campaigns and assignments</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">SMS Notifications</h3>
                    <p className="text-sm text-muted-foreground">Receive text messages for urgent requests</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  Text <strong>STOP</strong> to unsubscribe or adjust preferences here.
                </p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">In-App Notifications</h3>
                    <p className="text-sm text-muted-foreground">Receive notifications within the application</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Weekly Digest</h3>
                    <p className="text-sm text-muted-foreground">Receive a summary of the week's activities</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* Placeholder for other tabs */}
          {activeTab !== 'Profile' && activeTab !== 'Notifications' && (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-medium mb-4">{activeTab} Settings</h2>
              <p className="text-muted-foreground">This feature is coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 