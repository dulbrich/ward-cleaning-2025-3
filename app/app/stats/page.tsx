import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StatsCard from "@/components/stats/stats-card";
import { TasksChart, HoursChart, CategoryChart } from "@/components/stats/charts";
import ShareStatsButton from "@/components/stats/share-button";
import { createClient } from "@/utils/supabase/server";
import { fetchUserStats, fetchUserRank } from "@/lib/stats";
import { redirect } from "next/navigation";

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("username, avatar_url")
    .eq("user_id", user.id)
    .single();

  const { data: ward } = await supabase
    .from("ward_branches")
    .select("unit_number")
    .eq("user_id", user.id)
    .eq("is_primary", true)
    .single();

  const stats = await fetchUserStats(user.id);
  const rank = ward ? await fetchUserRank(user.id, ward.unit_number) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={profile?.avatar_url || "/images/avatars/default.png"} alt="avatar" />
          <AvatarFallback>{profile?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{profile?.username || "My Stats"}</h1>
          <p className="text-sm text-muted-foreground">
            {stats.lifetimePoints} points {rank && <>• Rank {rank}</>}
          </p>
        </div>
        <div className="ml-auto">
          <ShareStatsButton />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard title="Lifetime Points" value={stats.lifetimePoints} />
        <StatsCard title="Tasks Completed" value={stats.tasksCompleted} />
        <StatsCard title="Days Participated" value={stats.daysParticipated} />
        <StatsCard title="Hours Cleaning" value={stats.hoursSpent} />
        <StatsCard title="Best Streak" value={stats.bestStreak} />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Progress</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <TasksChart userId={user.id} />
          <HoursChart />
          <CategoryChart />
        </div>
      </div>
    </div>
  );
}
