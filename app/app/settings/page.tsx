
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings Navigation */}
        <div className="md:col-span-1">
          <nav className="bg-card rounded-lg border overflow-hidden">
            <div className="p-2">
              {[
                { name: 'Profile', active: true },
                { name: 'Account' },
                { name: 'Notifications' },
                { name: 'Preferences' },
                { name: 'Privacy' },
                { name: 'Security' },
                { name: 'Connected Services' },
                { name: 'Admin Options' }
              ].map((item, i) => (
                <button 
                  key={i} 
                  className={`w-full text-left px-3 py-2 rounded-md ${item.active ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </nav>
        </div>
        
        {/* Settings Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium">Profile Settings</h2>
              <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm">
                Save Changes
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-2xl font-medium">JD</span>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <button className="text-primary text-sm hover:underline">Upload new image</button>
                    <button className="text-muted-foreground text-sm hover:underline">Remove</button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recommended: Square JPG, PNG, or GIF, at least 400x400 pixels.
                  </p>
                </div>
              </div>
              
              {/* Profile Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium">
                    First Name
                  </label>
                  <input 
                    type="text" 
                    id="firstName"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    defaultValue="John"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </label>
                  <input 
                    type="text" 
                    id="lastName"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    defaultValue="Doe"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <input 
                    type="email" 
                    id="email"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    defaultValue="john.doe@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone
                  </label>
                  <input 
                    type="tel" 
                    id="phone"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    defaultValue="(555) 123-4567"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="bio" className="text-sm font-medium">
                    Bio
                  </label>
                  <textarea 
                    id="bio"
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    defaultValue="I'm a dedicated volunteer who loves helping with our building maintenance. I specialize in floor care and window cleaning."
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-medium mb-4">Notification Preferences</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive updates about campaigns and assignments</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">SMS Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive text messages for urgent requests</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">In-App Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive notifications within the application</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Weekly Digest</h3>
                  <p className="text-sm text-muted-foreground">Receive a summary of the week's activities</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 