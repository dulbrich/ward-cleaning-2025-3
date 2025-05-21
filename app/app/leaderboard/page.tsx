import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

interface SearchParams {
  page?: string;
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const pageSize = 10;
  const currentPage = parseInt(searchParams?.page ?? "1", 10);
  const offset = (currentPage - 1) * pageSize;

  const { data: ward } = await supabase
    .from("ward_branches")
    .select("id, unit_number")
    .eq("user_id", user.id)
    .eq("is_primary", true)
    .single();

  if (!ward) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p>No primary ward found.</p>
      </div>
    );
  }

  const { data: directory } = await supabase
    .from("anonymous_users")
    .select("registered_user_id")
    .eq("unit_number", ward.unit_number)
    .not("registered_user_id", "is", null);

  const wardUserIds =
    directory?.map((d) => d.registered_user_id as string).filter(Boolean) || [];

  if (wardUserIds.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p>No registered members in ward directory.</p>
      </div>
    );
  }

  const { data: pointsRows } = await supabase
    .from("user_points")
    .select("user_id, points")
    .eq("ward_branch_id", ward.id)
    .in("user_id", wardUserIds);

  const totals = new Map<string, number>();
  for (const row of pointsRows ?? []) {
    const uid = row.user_id as string;
    const pts = (row as any).points as number;
    totals.set(uid, (totals.get(uid) || 0) + pts);
  }

  let entries = Array.from(totals.entries()).map(([user_id, total_points]) => ({
    user_id,
    total_points,
  }));

  entries.sort((a, b) => b.total_points - a.total_points);

  const paged = entries.slice(offset, offset + pageSize);
  const ids = paged.map((e) => e.user_id);

  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("user_id, username, avatar_url")
    .in("user_id", ids);

  const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

  paged.forEach((entry) => {
    (entry as any).profile = profileMap.get(entry.user_id) || null;
  });

  const hasPrev = currentPage > 1;
  const hasNext = offset + pageSize < entries.length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Leaderboard</h1>

      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="p-4 bg-muted">
          <div className="grid grid-cols-12 font-medium">
            <div className="col-span-2">Rank</div>
            <div className="col-span-8">User Name</div>
            <div className="col-span-2 text-right">Points</div>
          </div>
        </div>

        <div className="divide-y">
          {paged.map((entry, idx) => {
            const rank = offset + idx + 1;
            const trophy =
              rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

            return (
              <div key={entry.user_id} className="p-4 hover:bg-muted/50">
                <div className="grid grid-cols-12 items-center">
                  <div className="col-span-2 flex items-center space-x-2">
                    <span>{rank}</span>
                    {trophy && <span>{trophy}</span>}
                  </div>
                  <div className="col-span-8 flex items-center space-x-2">
                    <Avatar>
                      <AvatarImage
                        src={entry.profile?.avatar_url || "/images/avatars/default.png"}
                        alt={entry.profile?.username || "avatar"}
                      />
                      <AvatarFallback>
                        {entry.profile?.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {entry.profile?.username || "Unknown"}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">{entry.total_points}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between text-sm">
        {hasPrev ? (
          <Link href={`/app/leaderboard?page=${currentPage - 1}`}>Previous</Link>
        ) : (
          <span />
        )}
        {hasNext ? (
          <Link href={`/app/leaderboard?page=${currentPage + 1}`}>Next</Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
