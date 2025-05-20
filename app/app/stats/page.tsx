
import Image from "next/image";
import { Trophy } from "lucide-react";

type Leader = {
  username: string;
  avatar: string;
  points: number;
};

const data: Leader[] = [
  { username: "sarah", avatar: "/images/avatars/avatar1.png", points: 150 },
  { username: "michael", avatar: "/images/avatars/avatar2.png", points: 135 },
  { username: "jessica", avatar: "/images/avatars/avatar3.png", points: 120 },
  { username: "david", avatar: "/images/avatars/avatar4.png", points: 110 },
  { username: "emily", avatar: "/images/avatars/avatar5.png", points: 105 },
  { username: "jason", avatar: "/images/avatars/avatar1.png", points: 100 },
];

export default function StatsPage() {
  const topThree = data.slice(0, 3);
  const others = data.slice(3);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Leaderboard</h1>

      {/* Top 3 placement */}
      <div className="flex justify-center gap-6">
        {topThree.map((user, idx) => {
          const rank = idx + 1;
          const orderClasses = rank === 1 ? "order-2" : rank === 2 ? "order-1" : "order-3";
          const trophyColor =
            rank === 1 ? "text-amber-400" : rank === 2 ? "text-gray-400" : "text-orange-700";

          return (
            <div key={user.username} className={`flex flex-col items-center ${orderClasses}`}>
              <Trophy className={`h-6 w-6 ${trophyColor}`} />
              <Image
                src={user.avatar}
                alt={user.username}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover mt-2"
              />
              <span className="mt-2 font-medium">{user.username}</span>
              <span className="text-sm text-muted-foreground">{user.points} pts</span>
            </div>
          );
        })}
      </div>

      {/* Remaining rankings */}
      <div className="bg-card rounded-lg border overflow-hidden divide-y mt-6">
        {others.map((user, index) => (
          <div key={user.username} className="flex items-center p-4">
            <div className="w-6 text-sm font-medium">{index + 4}</div>
            <div className="flex items-center gap-2 flex-1">
              <Image
                src={user.avatar}
                alt={user.username}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
              <span className="font-medium">{user.username}</span>
            </div>
            <div className="text-sm font-medium">{user.points} pts</div>
          </div>
        ))}
      </div>
    </div>
  );
}
