import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Profile</h1>
      
      <div className="bg-card border rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-medium">Email</h2>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          
          <div>
            <h2 className="text-lg font-medium">User ID</h2>
            <p className="text-muted-foreground">{user.id}</p>
          </div>
          
          <div>
            <h2 className="text-lg font-medium">Last Sign In</h2>
            <p className="text-muted-foreground">
              {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 