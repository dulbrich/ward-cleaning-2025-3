
export default function StatsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Stats</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg p-4 border">
          <h2 className="text-lg font-medium mb-2">Cleaning Sessions</h2>
          <p className="text-4xl font-bold text-primary">12</p>
          <p className="text-sm text-muted-foreground mt-1">Last 30 days</p>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <h2 className="text-lg font-medium mb-2">Total Hours</h2>
          <p className="text-4xl font-bold text-primary">24.5</p>
          <p className="text-sm text-muted-foreground mt-1">Last 30 days</p>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <h2 className="text-lg font-medium mb-2">Completion Rate</h2>
          <p className="text-4xl font-bold text-primary">98%</p>
          <p className="text-sm text-muted-foreground mt-1">All time</p>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mt-6">Recent Activity</h2>
      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <p className="text-sm font-medium">April 2, 2025</p>
          <p>Completed chapel cleaning session</p>
          <p className="text-sm text-muted-foreground">2.5 hours</p>
        </div>
        <div className="p-4 border-b">
          <p className="text-sm font-medium">March 26, 2025</p>
          <p>Completed nursery cleaning session</p>
          <p className="text-sm text-muted-foreground">1.5 hours</p>
        </div>
        <div className="p-4">
          <p className="text-sm font-medium">March 19, 2025</p>
          <p>Completed restroom cleaning session</p>
          <p className="text-sm text-muted-foreground">1 hour</p>
        </div>
      </div>
    </div>
  );
} 