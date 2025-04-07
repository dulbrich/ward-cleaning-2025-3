
export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Tasks</h1>
        <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
          New Task
        </button>
      </div>
      
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="p-4 border-b bg-muted">
          <h2 className="font-medium">Upcoming Tasks</h2>
        </div>
        
        <div className="divide-y">
          <div className="p-4 hover:bg-muted/50">
            <div className="flex justify-between mb-2">
              <h3 className="font-medium">Chapel Cleaning</h3>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Assigned</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Clean chairs, vacuum floors, and dust surfaces in the chapel area.</p>
            <div className="flex justify-between text-sm">
              <span>Due: April 8, 2025</span>
              <span>2.5 hours estimated</span>
            </div>
          </div>
          
          <div className="p-4 hover:bg-muted/50">
            <div className="flex justify-between mb-2">
              <h3 className="font-medium">Restroom Maintenance</h3>
              <span className="text-sm bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Pending</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Clean and sanitize all restrooms, restock supplies.</p>
            <div className="flex justify-between text-sm">
              <span>Due: April 15, 2025</span>
              <span>1.5 hours estimated</span>
            </div>
          </div>
          
          <div className="p-4 hover:bg-muted/50">
            <div className="flex justify-between mb-2">
              <h3 className="font-medium">Nursery Cleaning</h3>
              <span className="text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Confirmed</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Sanitize toys, clean floors, and organize nursery room.</p>
            <div className="flex justify-between text-sm">
              <span>Due: April 22, 2025</span>
              <span>1 hour estimated</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="p-4 border-b bg-muted">
          <h2 className="font-medium">Completed Tasks</h2>
        </div>
        
        <div className="divide-y">
          <div className="p-4 hover:bg-muted/50">
            <div className="flex justify-between mb-2">
              <h3 className="font-medium">Cultural Hall Cleaning</h3>
              <span className="text-sm bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">Completed</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Clean floors, arrange chairs, and check equipment in the cultural hall.</p>
            <div className="flex justify-between text-sm">
              <span>Completed: April 1, 2025</span>
              <span>3 hours</span>
            </div>
          </div>
          
          <div className="p-4 hover:bg-muted/50">
            <div className="flex justify-between mb-2">
              <h3 className="font-medium">Kitchen Deep Clean</h3>
              <span className="text-sm bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">Completed</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Clean all kitchen surfaces, appliances, and organize cabinets.</p>
            <div className="flex justify-between text-sm">
              <span>Completed: March 25, 2025</span>
              <span>2 hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 