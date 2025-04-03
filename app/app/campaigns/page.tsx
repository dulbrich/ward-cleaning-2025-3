
export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cleaning Campaigns</h1>
        <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
          Create Campaign
        </button>
      </div>
      
      <div className="bg-card rounded-lg border p-4 space-y-4">
        <h2 className="text-xl font-medium">Active Campaigns</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="h-40 bg-gradient-to-r from-blue-500 to-indigo-600 p-4 flex items-end">
              <h3 className="text-white text-lg font-medium">Spring Clean-Up 2025</h3>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">Apr 1 - Apr 30, 2025</p>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[65%]"></div>
              </div>
              <div className="flex justify-between text-sm">
                <span>65% Complete</span>
                <span>26/40 Hours</span>
              </div>
              <div className="flex justify-between">
                <div className="text-sm">
                  <p>15 Members Participating</p>
                </div>
                <button className="text-primary text-sm hover:underline">View Details</button>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <div className="h-40 bg-gradient-to-r from-green-500 to-emerald-600 p-4 flex items-end">
              <h3 className="text-white text-lg font-medium">Chapel Maintenance</h3>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">Mar 15 - May 15, 2025</p>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[40%]"></div>
              </div>
              <div className="flex justify-between text-sm">
                <span>40% Complete</span>
                <span>20/50 Hours</span>
              </div>
              <div className="flex justify-between">
                <div className="text-sm">
                  <p>8 Members Participating</p>
                </div>
                <button className="text-primary text-sm hover:underline">View Details</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-card rounded-lg border p-4 space-y-4">
        <h2 className="text-xl font-medium">Upcoming Campaigns</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="h-40 bg-gradient-to-r from-amber-500 to-yellow-600 p-4 flex items-end">
              <h3 className="text-white text-lg font-medium">Summer Service Day</h3>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">May 25, 2025</p>
              <p className="text-sm">A one-day event to clean all building exteriors and grounds.</p>
              <div className="flex justify-between">
                <div className="text-sm">
                  <p className="text-blue-600 font-medium">Sign up opens in 2 weeks</p>
                </div>
                <button className="text-primary text-sm hover:underline">Get Notified</button>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <div className="h-40 bg-gradient-to-r from-purple-500 to-pink-600 p-4 flex items-end">
              <h3 className="text-white text-lg font-medium">Annual Deep Clean</h3>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">Jul 1 - Jul 31, 2025</p>
              <p className="text-sm">Our most thorough cleaning initiative of the year.</p>
              <div className="flex justify-between">
                <div className="text-sm">
                  <p className="text-blue-600 font-medium">Planning in progress</p>
                </div>
                <button className="text-primary text-sm hover:underline">Learn More</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 