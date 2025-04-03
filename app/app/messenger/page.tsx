
export default function MessengerPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Messenger</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contacts/Conversations List */}
        <div className="bg-card rounded-lg border overflow-hidden md:col-span-1">
          <div className="p-3 border-b bg-muted flex items-center justify-between">
            <h2 className="font-medium">Conversations</h2>
            <button className="text-sm text-primary hover:underline">New Message</button>
          </div>
          
          <div className="divide-y">
            <div className="p-3 hover:bg-muted/50 bg-primary/5">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-700 font-medium">SJ</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-medium">Sarah Johnson</h3>
                    <span className="text-xs text-muted-foreground">2m</span>
                  </div>
                  <p className="text-sm truncate text-muted-foreground">Can you help with the nursery cleaning?</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 hover:bg-muted/50">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-700 font-medium">MS</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-medium">Michael Smith</h3>
                    <span className="text-xs text-muted-foreground">1h</span>
                  </div>
                  <p className="text-sm truncate text-muted-foreground">Thanks for your help yesterday!</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 hover:bg-muted/50">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-700 font-medium">JW</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-medium">Jessica Williams</h3>
                    <span className="text-xs text-muted-foreground">1d</span>
                  </div>
                  <p className="text-sm truncate text-muted-foreground">We need more cleaning supplies...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="bg-card rounded-lg border flex flex-col md:col-span-2 h-[70vh]">
          <div className="p-3 border-b bg-muted">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-700 font-medium text-sm">SJ</span>
              </div>
              <h2 className="font-medium">Sarah Johnson</h2>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {/* Messages */}
            <div className="flex justify-start">
              <div className="bg-muted p-3 rounded-lg max-w-[80%]">
                <p className="text-sm">Hi there! I was wondering if you could help with the nursery cleaning this weekend?</p>
                <span className="text-xs text-muted-foreground mt-1 block">10:24 AM</span>
              </div>
            </div>
            
            <div className="flex justify-end">
              <div className="bg-primary/10 p-3 rounded-lg max-w-[80%]">
                <p className="text-sm">Sure! What time were you thinking?</p>
                <span className="text-xs text-muted-foreground mt-1 block">10:26 AM</span>
              </div>
            </div>
            
            <div className="flex justify-start">
              <div className="bg-muted p-3 rounded-lg max-w-[80%]">
                <p className="text-sm">Would Saturday at 9 AM work for you? I think it will take about an hour.</p>
                <span className="text-xs text-muted-foreground mt-1 block">10:30 AM</span>
              </div>
            </div>
          </div>
          
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              />
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 