
export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Leaderboard</h1>
      
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="p-4 bg-muted">
          <div className="grid grid-cols-12 font-medium">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">Member</div>
            <div className="col-span-3 text-right">Hours</div>
            <div className="col-span-3 text-right">Sessions</div>
          </div>
        </div>
        
        <div className="divide-y">
          {/* First place */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20">
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-1">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-200 text-yellow-800">1</span>
              </div>
              <div className="col-span-5 font-medium">Sarah Johnson</div>
              <div className="col-span-3 text-right">32.5</div>
              <div className="col-span-3 text-right">15</div>
            </div>
          </div>
          
          {/* Second place */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/20">
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-1">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-800">2</span>
              </div>
              <div className="col-span-5 font-medium">Michael Smith</div>
              <div className="col-span-3 text-right">28.0</div>
              <div className="col-span-3 text-right">13</div>
            </div>
          </div>
          
          {/* Third place */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20">
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-1">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-200 text-amber-800">3</span>
              </div>
              <div className="col-span-5 font-medium">Jessica Williams</div>
              <div className="col-span-3 text-right">26.5</div>
              <div className="col-span-3 text-right">12</div>
            </div>
          </div>
          
          {/* Regular entries */}
          <div className="p-4 hover:bg-muted/50">
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-1">4</div>
              <div className="col-span-5 font-medium">David Brown</div>
              <div className="col-span-3 text-right">22.0</div>
              <div className="col-span-3 text-right">10</div>
            </div>
          </div>
          
          <div className="p-4 hover:bg-muted/50">
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-1">5</div>
              <div className="col-span-5 font-medium">Emily Davis</div>
              <div className="col-span-3 text-right">18.5</div>
              <div className="col-span-3 text-right">9</div>
            </div>
          </div>
          
          <div className="p-4 hover:bg-muted/50">
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-1">6</div>
              <div className="col-span-5 font-medium">Jason Miller</div>
              <div className="col-span-3 text-right">16.0</div>
              <div className="col-span-3 text-right">8</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center text-sm text-muted-foreground">
        Leaderboard is updated every Sunday at midnight
      </div>
    </div>
  );
} 