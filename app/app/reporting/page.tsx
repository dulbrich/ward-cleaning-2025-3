
export default function ReportingPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reporting</h1>
        <div className="flex gap-2">
          <select className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
            <option>Last 30 Days</option>
            <option>Last Quarter</option>
            <option>Year to Date</option>
            <option>Custom Range</option>
          </select>
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
            Export Data
          </button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <p className="text-sm text-muted-foreground">Total Cleaning Hours</p>
          <h3 className="text-2xl font-bold mt-1">428</h3>
          <p className="text-xs text-green-600 mt-1">+12% from last period</p>
        </div>
        
        <div className="bg-card p-4 rounded-lg border">
          <p className="text-sm text-muted-foreground">Active Volunteers</p>
          <h3 className="text-2xl font-bold mt-1">36</h3>
          <p className="text-xs text-green-600 mt-1">+4 new volunteers</p>
        </div>
        
        <div className="bg-card p-4 rounded-lg border">
          <p className="text-sm text-muted-foreground">Campaigns Completed</p>
          <h3 className="text-2xl font-bold mt-1">5</h3>
          <p className="text-xs text-muted-foreground mt-1">2 in progress</p>
        </div>
        
        <div className="bg-card p-4 rounded-lg border">
          <p className="text-sm text-muted-foreground">Avg. Hours per Member</p>
          <h3 className="text-2xl font-bold mt-1">11.9</h3>
          <p className="text-xs text-red-600 mt-1">-2% from last period</p>
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-4 rounded-lg border">
          <h2 className="text-lg font-medium mb-4">Hours by Location</h2>
          <div className="flex flex-col space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Chapel</span>
                <span className="font-medium">142 hrs</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[33%]"></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Cultural Hall</span>
                <span className="font-medium">86 hrs</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[20%]"></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Classrooms</span>
                <span className="font-medium">124 hrs</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[29%]"></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Restrooms</span>
                <span className="font-medium">76 hrs</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-[18%]"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-card p-4 rounded-lg border">
          <h2 className="text-lg font-medium mb-4">Monthly Participation</h2>
          <div className="h-64 flex items-end gap-1 pb-6 pt-2">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((month, i) => {
              const heights = [40, 60, 45, 80, 65, 75, 90, 85, 70];
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-primary/80 rounded-sm" 
                    style={{ height: `${heights[i]}%` }}
                  ></div>
                  <span className="text-xs text-muted-foreground">{month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium">Recent Activity</h2>
        </div>
        
        <div className="divide-y">
          {[
            { user: 'Sarah Johnson', action: 'completed 4 hours in Chapel Cleaning', time: '2 days ago' },
            { user: 'Michael Smith', action: 'led the Bathroom Deep Clean team', time: '3 days ago' },
            { user: 'Jessica Williams', action: 'logged 2.5 hours in Classroom Cleaning', time: '5 days ago' },
            { user: 'David Brown', action: 'completed Cultural Hall floor cleaning', time: '1 week ago' },
            { user: 'Emily Davis', action: 'organized the Spring Clean-Up campaign', time: '1 week ago' }
          ].map((item, i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{item.user}</p>
                <p className="text-sm text-muted-foreground">{item.action}</p>
              </div>
              <span className="text-xs text-muted-foreground">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 