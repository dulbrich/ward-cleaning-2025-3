
export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cleaning Schedule</h1>
        <div className="flex gap-3">
          <div className="flex border rounded-md overflow-hidden">
            <button className="px-3 py-1.5 text-sm bg-primary text-primary-foreground">Month</button>
            <button className="px-3 py-1.5 text-sm hover:bg-muted/50">Week</button>
            <button className="px-3 py-1.5 text-sm hover:bg-muted/50">Day</button>
          </div>
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-1.5 rounded-md text-sm">
            New Event
          </button>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button className="p-1 rounded-full hover:bg-muted">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h2 className="text-xl font-medium">April 2025</h2>
          <button className="p-1 rounded-full hover:bg-muted">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
        <button className="text-sm hover:underline text-primary">Today</button>
      </div>
      
      <div className="bg-card rounded-lg border overflow-hidden">
        {/* Month Header */}
        <div className="grid grid-cols-7 border-b bg-muted text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-2 font-medium text-sm">{day}</div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 grid-rows-5 auto-rows-fr">
          {/* Week 1 */}
          <div className="border-r border-b p-1 min-h-[120px] bg-muted/30 text-muted-foreground">
            <div className="text-right p-1">30</div>
          </div>
          <div className="border-r border-b p-1 min-h-[120px] bg-muted/30 text-muted-foreground">
            <div className="text-right p-1">31</div>
          </div>
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">1</div>
          </div>
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">2</div>
            <div className="mt-1 bg-blue-100 text-blue-800 text-xs p-1 rounded">
              Chapel Cleaning (1PM)
            </div>
          </div>
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">3</div>
          </div>
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">4</div>
          </div>
          <div className="border-b p-1 min-h-[120px]">
            <div className="text-right p-1">5</div>
          </div>
          
          {/* Week 2 */}
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">6</div>
          </div>
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">7</div>
          </div>
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">8</div>
            <div className="mt-1 bg-green-100 text-green-800 text-xs p-1 rounded">
              Nursery Cleaning (10AM)
            </div>
          </div>
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">9</div>
          </div>
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">10</div>
          </div>
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">11</div>
          </div>
          <div className="border-b p-1 min-h-[120px]">
            <div className="text-right p-1">12</div>
            <div className="mt-1 bg-purple-100 text-purple-800 text-xs p-1 rounded">
              Weekly Review (4PM)
            </div>
          </div>
          
          {/* Week 3 */}
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">13</div>
          </div>
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">14</div>
          </div>
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">15</div>
            <div className="mt-1 bg-amber-100 text-amber-800 text-xs p-1 rounded">
              Restroom Cleaning (2PM)
            </div>
          </div>
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">16</div>
          </div>
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">17</div>
          </div>
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">18</div>
          </div>
          <div className="border-b p-1 min-h-[120px]">
            <div className="text-right p-1">19</div>
          </div>
          
          {/* Week 4 */}
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">20</div>
          </div>
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">21</div>
          </div>
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">22</div>
            <div className="mt-1 bg-blue-100 text-blue-800 text-xs p-1 rounded">
              Chapel Cleaning (1PM)
            </div>
          </div>
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">23</div>
          </div>
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">24</div>
          </div>
          <div className="border-r border-b p-1 min-h-[120px]">
            <div className="text-right p-1">25</div>
          </div>
          <div className="border-b p-1 min-h-[120px]">
            <div className="text-right p-1">26</div>
            <div className="mt-1 bg-purple-100 text-purple-800 text-xs p-1 rounded">
              Weekly Review (4PM)
            </div>
          </div>
          
          {/* Week 5 */}
          <div className="border-r p-1 min-h-[120px]">
            <div className="text-right p-1">27</div>
          </div>
          <div className="border-r p-1 min-h-[120px]">
            <div className="text-right p-1">28</div>
          </div>
          <div className="border-r p-1 min-h-[120px]">
            <div className="text-right p-1">29</div>
            <div className="mt-1 bg-green-100 text-green-800 text-xs p-1 rounded">
              Nursery Cleaning (10AM)
            </div>
          </div>
          <div className="border-r p-1 min-h-[120px]">
            <div className="text-right p-1">30</div>
          </div>
          <div className="border-r p-1 min-h-[120px] bg-muted/30 text-muted-foreground">
            <div className="text-right p-1">1</div>
          </div>
          <div className="border-r p-1 min-h-[120px] bg-muted/30 text-muted-foreground">
            <div className="text-right p-1">2</div>
          </div>
          <div className="p-1 min-h-[120px] bg-muted/30 text-muted-foreground">
            <div className="text-right p-1">3</div>
          </div>
        </div>
      </div>
    </div>
  );
} 