"use client";

import { FormMessage, Message } from "@/components/form-message";
import FetchDataSteps from "@/components/tutorial/fetch-data-steps";
import { InfoIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

// Client component for checking local storage
export default function ClientProfile({ 
  user, 
  serverProfile, 
  searchParamsMessage 
}: { 
  user: any;
  serverProfile: any;
  searchParamsMessage: Message | null;
}) {
  const [profile, setProfile] = useState(serverProfile);
  const [message, setMessage] = useState<Message | null>(searchParamsMessage);
  const [hasPendingProfile, setHasPendingProfile] = useState(false);
  const [pendingProfileData, setPendingProfileData] = useState<any>(null);

  // Check for pending profile data in local storage
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('pendingProfileData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setHasPendingProfile(true);
        setPendingProfileData(parsedData);
      }
    } catch (error) {
      console.error("Error checking for pending profile:", error);
    }
  }, []);

  // Function to apply pending profile
  const applyPendingProfile = async () => {
    try {
      if (!pendingProfileData) return;
      
      // Clear message
      setMessage(null);
      
      // Show loading message
      setMessage({ message: "Applying your profile data..." });
      
      // Construct form data from pending profile
      const formData = new FormData();
      formData.append('pendingProfileData', JSON.stringify(pendingProfileData));
      
      // Submit to apply pending profile API
      const response = await fetch('/api/user-profile/apply-pending', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        // Remove pending data
        localStorage.removeItem('pendingProfileData');
        setHasPendingProfile(false);
        
        const result = await response.json();
        
        // Show success message
        setMessage({ success: result.message || "Your profile has been created successfully!" });
        
        // Refresh the page to show the new profile
        window.location.reload();
      } else {
        const errorData = await response.json();
        setMessage({ error: errorData.error || "Failed to apply your profile data. Please try again." });
      }
    } catch (error) {
      console.error("Error applying pending profile:", error);
      setMessage({ error: "An error occurred while applying your profile." });
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated
          user
        </div>
        
        {message && (
          <div className="mt-4">
            <FormMessage message={message} />
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-6">
        <h2 className="font-bold text-2xl">Your Profile</h2>
        
        <div className="flex items-center gap-4">
          {profile?.avatar_url ? (
            <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-primary">
              <Image 
                src={profile.avatar_url}
                alt="Your avatar"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xl">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          
          <div>
            {profile ? (
              <>
                <h3 className="text-xl font-semibold">{profile.first_name} {profile.last_name}</h3>
                <p className="text-muted-foreground">@{profile.username}</p>
              </>
            ) : (
              <h3 className="text-xl font-semibold">{user.email}</h3>
            )}
          </div>
        </div>
        
        {profile ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card p-4 rounded-lg border">
              <h4 className="font-medium mb-2">Contact Information</h4>
              <p className="text-sm text-muted-foreground">Email: {user.email}</p>
              {profile.phone_number && (
                <p className="text-sm text-muted-foreground">
                  Phone: {profile.phone_number} 
                  {profile.is_phone_verified ? 
                    <span className="text-green-500 ml-2">(Verified)</span> : 
                    <span className="text-amber-500 ml-2">(Not verified)</span>
                  }
                </p>
              )}
            </div>
            
            <div className="bg-card p-4 rounded-lg border">
              <h4 className="font-medium mb-2">Account Status</h4>
              <p className="text-sm text-muted-foreground">
                Terms accepted: {profile.has_accepted_terms ? 
                  <span className="text-green-500">Yes</span> : 
                  <span className="text-amber-500">No</span>
                }
              </p>
              <p className="text-sm text-muted-foreground">
                Account created: {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <p className="text-amber-800 mb-3">Your profile information is incomplete.</p>
            
            {hasPendingProfile ? (
              <div>
                <p className="text-sm text-amber-800 mb-2">
                  We found your saved profile information. Would you like to apply it now?
                </p>
                <button 
                  onClick={applyPendingProfile}
                  className="bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-primary/90"
                >
                  Apply Saved Profile
                </button>
              </div>
            ) : (
              <form action="/api/user-profile/create" method="POST" className="mt-2">
                <input type="hidden" name="email" value={user.email || ''} />
                <button 
                  type="submit"
                  className="bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-primary/90"
                >
                  Complete Your Profile
                </button>
              </form>
            )}
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Your user details</h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      
      <div>
        <h2 className="font-bold text-2xl mb-4">Next steps</h2>
        <FetchDataSteps />
      </div>
    </div>
  );
} 