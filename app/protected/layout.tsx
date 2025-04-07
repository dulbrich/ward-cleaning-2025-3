import DashboardLayout from "@/components/dashboard/layout";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

// Force dynamic rendering for protected routes
export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get the user's profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Pass user data as props
  return (
    <DashboardLayout user={user} profile={profile || {}}>
      {children}
    </DashboardLayout>
  );
} 