
export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Contacts</h1>
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="search"
              placeholder="Search contacts..."
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            />
            <svg
              className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground"
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
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
            Add Contact
          </button>
        </div>
      </div>
      
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="p-4 border-b bg-muted">
          <div className="grid grid-cols-12 font-medium">
            <div className="col-span-5">Name</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-3">Contact</div>
            <div className="col-span-1"></div>
          </div>
        </div>
        
        <div className="divide-y">
          <div className="p-4 hover:bg-muted/50">
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-700 font-medium">SJ</span>
                </div>
                <div>
                  <h3 className="font-medium">Sarah Johnson</h3>
                  <p className="text-xs text-muted-foreground">sarahjohnson@example.com</p>
                </div>
              </div>
              <div className="col-span-3">Coordinator</div>
              <div className="col-span-3">+1 (555) 123-4567</div>
              <div className="col-span-1 text-right">
                <button className="text-primary hover:underline text-sm">View</button>
              </div>
            </div>
          </div>
          
          <div className="p-4 hover:bg-muted/50">
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-700 font-medium">MS</span>
                </div>
                <div>
                  <h3 className="font-medium">Michael Smith</h3>
                  <p className="text-xs text-muted-foreground">michaelsmith@example.com</p>
                </div>
              </div>
              <div className="col-span-3">Team Lead</div>
              <div className="col-span-3">+1 (555) 987-6543</div>
              <div className="col-span-1 text-right">
                <button className="text-primary hover:underline text-sm">View</button>
              </div>
            </div>
          </div>
          
          <div className="p-4 hover:bg-muted/50">
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-700 font-medium">JW</span>
                </div>
                <div>
                  <h3 className="font-medium">Jessica Williams</h3>
                  <p className="text-xs text-muted-foreground">jessicawilliams@example.com</p>
                </div>
              </div>
              <div className="col-span-3">Volunteer</div>
              <div className="col-span-3">+1 (555) 234-5678</div>
              <div className="col-span-1 text-right">
                <button className="text-primary hover:underline text-sm">View</button>
              </div>
            </div>
          </div>
          
          <div className="p-4 hover:bg-muted/50">
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="text-amber-700 font-medium">DB</span>
                </div>
                <div>
                  <h3 className="font-medium">David Brown</h3>
                  <p className="text-xs text-muted-foreground">davidbrown@example.com</p>
                </div>
              </div>
              <div className="col-span-3">Volunteer</div>
              <div className="col-span-3">+1 (555) 876-5432</div>
              <div className="col-span-1 text-right">
                <button className="text-primary hover:underline text-sm">View</button>
              </div>
            </div>
          </div>
          
          <div className="p-4 hover:bg-muted/50">
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-700 font-medium">ED</span>
                </div>
                <div>
                  <h3 className="font-medium">Emily Davis</h3>
                  <p className="text-xs text-muted-foreground">emilydavis@example.com</p>
                </div>
              </div>
              <div className="col-span-3">Admin</div>
              <div className="col-span-3">+1 (555) 345-6789</div>
              <div className="col-span-1 text-right">
                <button className="text-primary hover:underline text-sm">View</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 