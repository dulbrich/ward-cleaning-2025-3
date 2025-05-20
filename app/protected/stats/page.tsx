import { UserAvatar } from "@/components/dashboard/user-avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { getUserAvatarUrl, getUserDisplayName } from "@/utils/user-helpers";
import { redirect } from "next/navigation";

export default async function StatsPage() {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return redirect("/sign-in");
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
    }

    const displayName = getUserDisplayName(user, profile || {});
    const avatarUrl = getUserAvatarUrl(profile || {});

  // TODO: Replace placeholder values with real aggregated data
  const lifetimePoints = 0;
  const leaderboardRank = 0;
  const totalTasks = 0;
  const hoursSpent = 0;
  const daysParticipated = 0;
  const bestStreak = 0;

    return (
      <div className="space-y-8">
      <div className="flex items-center gap-4">
        <UserAvatar displayName={displayName} avatarUrl={avatarUrl} />
        <div>
          <h1 className="text-2xl font-bold">{displayName}'s Stats</h1>
          <p className="text-sm text-muted-foreground">
            Lifetime Points: {lifetimePoints} • Rank: #{leaderboardRank}
          </p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card border rounded-lg p-4 text-center">
          <h3 className="text-sm font-medium mb-1">Total Tasks Completed</h3>
          <p className="text-4xl font-bold text-primary">{totalTasks}</p>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <h3 className="text-sm font-medium mb-1">Hours Spent Cleaning</h3>
          <p className="text-4xl font-bold text-primary">{hoursSpent}</p>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <h3 className="text-sm font-medium mb-1">Days Participated</h3>
          <p className="text-4xl font-bold text-primary">{daysParticipated}</p>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <h3 className="text-sm font-medium mb-1">Best Streak (weeks)</h3>
          <p className="text-4xl font-bold text-primary">{bestStreak}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Tasks Over Time</h3>
          <div className="h-48 flex items-center justify-center border border-dashed rounded-md text-muted-foreground text-sm">
            Chart Placeholder
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Hours Per Month</h3>
          <div className="h-48 flex items-center justify-center border border-dashed rounded-md text-muted-foreground text-sm">
            Chart Placeholder
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4 md:col-span-2">
          <h3 className="font-semibold mb-2">Task Categories</h3>
          <div className="h-48 flex items-center justify-center border border-dashed rounded-md text-muted-foreground text-sm">
            Chart Placeholder
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="bg-card border rounded-lg divide-y">
          <div className="p-4 text-sm text-muted-foreground">No recent activity</div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline">Last 30 Days</Button>
        <Button>Share Stats</Button>
      </div>
    </div>
    );
  } catch (error) {
    console.error("Error rendering StatsPage:", error);
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Stats</h1>
        <p className="text-sm text-muted-foreground">Unable to load your stats.</p>
      </div>
    );
  }
}
