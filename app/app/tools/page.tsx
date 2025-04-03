
export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cleaning Tools</h1>
        <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
          Request New Tool
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tools Categories */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card rounded-lg border p-4">
            <h2 className="text-lg font-medium mb-3">Categories</h2>
            <div className="space-y-1">
              {[
                { name: 'All Tools', count: 48 },
                { name: 'Mops & Brooms', count: 12 },
                { name: 'Vacuums', count: 5 },
                { name: 'Cleaners', count: 14 },
                { name: 'Supplies', count: 10 },
                { name: 'Special Equipment', count: 7 }
              ].map((category, i) => (
                <button 
                  key={i} 
                  className={`w-full text-left px-3 py-2 rounded-md flex justify-between items-center ${i === 0 ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                >
                  <span>{category.name}</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{category.count}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-card rounded-lg border p-4">
            <h2 className="text-lg font-medium mb-3">Status</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Available (34)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span>In Use (8)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span>Maintenance (6)</span>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg border p-4">
            <h2 className="text-lg font-medium mb-3">Storage Locations</h2>
            <div className="space-y-2">
              {[
                'Main Closet', 
                'Chapel Storage', 
                'Cultural Hall Closet', 
                'Basement Storage'
              ].map((location, i) => (
                <div key={i} className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-muted-foreground">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span>{location}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Tools Listing */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Available Tools</h2>
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search tools..."
                  className="rounded-md border border-input bg-background px-3 py-2 pl-8 text-sm ring-offset-background"
                />
                <svg
                  className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {[
                { 
                  name: 'Commercial Vacuum', 
                  type: 'Vacuums', 
                  location: 'Main Closet', 
                  status: 'Available',
                  lastUsed: '2 days ago',
                  statusColor: 'bg-green-500'
                },
                { 
                  name: 'Microfiber Mop Set', 
                  type: 'Mops & Brooms', 
                  location: 'Chapel Storage', 
                  status: 'Available',
                  lastUsed: '1 week ago',
                  statusColor: 'bg-green-500'
                },
                { 
                  name: 'Floor Buffer', 
                  type: 'Special Equipment', 
                  location: 'Cultural Hall Closet', 
                  status: 'In Use',
                  lastUsed: 'Currently in use',
                  statusColor: 'bg-amber-500'
                },
                { 
                  name: 'Window Cleaning Kit', 
                  type: 'Supplies', 
                  location: 'Main Closet', 
                  status: 'Available',
                  lastUsed: '3 days ago',
                  statusColor: 'bg-green-500'
                },
                { 
                  name: 'Steam Cleaner', 
                  type: 'Special Equipment', 
                  location: 'Basement Storage', 
                  status: 'Maintenance',
                  lastUsed: 'Under repair',
                  statusColor: 'bg-red-500'
                }
              ].map((tool, i) => (
                <div key={i} className="p-4 border rounded-lg flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{tool.name}</h3>
                    <p className="text-sm text-muted-foreground">{tool.type} • {tool.location}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${tool.statusColor}`}></div>
                      <span className="text-sm">{tool.status}</span>
                    </div>
                    <button className={`text-primary text-sm hover:underline ${tool.status !== 'Available' && 'opacity-50 cursor-not-allowed'}`}>
                      {tool.status === 'Available' ? 'Check Out' : tool.lastUsed}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex justify-center">
              <button className="text-primary text-sm hover:underline">View All Tools →</button>
            </div>
          </div>
          
          <div className="bg-card rounded-lg border p-4">
            <h2 className="text-lg font-medium mb-3">Recently Checked Out</h2>
            <div className="divide-y">
              {[
                { user: 'Michael Smith', tool: 'Floor Buffer', checkedOut: '2 hours ago', return: 'Expected today 5 PM' },
                { user: 'David Brown', tool: 'Carpet Cleaner', checkedOut: 'Yesterday', return: 'Expected tomorrow' },
                { user: 'Sarah Johnson', tool: 'Extension Ladder', checkedOut: '3 days ago', return: 'Returned' }
              ].map((item, i) => (
                <div key={i} className="py-3 grid grid-cols-4 gap-2">
                  <div className="col-span-1">
                    <p className="font-medium text-sm">{item.user}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm">{item.tool}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm text-muted-foreground">{item.checkedOut}</p>
                  </div>
                  <div className="col-span-1 text-right">
                    <p className="text-sm text-muted-foreground">{item.return}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 