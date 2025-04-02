import FetchDataSteps from "@/components/tutorial/fetch-data-steps";
import { createClient } from "@/utils/supabase/server";
import { InfoIcon } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";

// Helper function to get user profile
async function getUserProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  
  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
  
  return data;
}

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }
  
  // Get the user's profile
  const profile = await getUserProfile(user.id);

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated
          user
        </div>
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
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800">
            <p>Your profile information is incomplete. Please complete the sign-up process.</p>
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
