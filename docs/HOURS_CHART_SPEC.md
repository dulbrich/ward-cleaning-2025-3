# Hours Chart Specification

## Overview
The Hours Chart visualizes a user's time spent cleaning across different time periods. This elegant, flowing visualization displays on the user's stats page and helps them track their cleaning effort over time, encouraging consistent participation and providing a sense of accomplishment.

## Business Goals
- **Engagement**: Encourage users to track and increase their cleaning hours
- **Motivation**: Provide visual feedback on cleaning contribution over time
- **Metrics**: Support Ward/Branch leaders in understanding member participation

## Data Architecture

### Data Sources
- **Primary**: `cleaning_session_tasks` table records with `assigned_at` and `completed_at` timestamps
- **Supporting**: `cleaning_sessions` table for contextual information

### Data Model
The application will calculate time spent by computing the difference between `completed_at` and `assigned_at` timestamps for each completed task, with some business rules:

1. **Time Calculation Rules**:
   - Basic calculation: `completed_at - assigned_at` = time spent on task
   - Maximum cap of 2 hours per task (to prevent outliers from tasks left open)
   - Minimum threshold of 1 minute (to filter out accidentally completed tasks)
   - Null values for either timestamp will use sensible defaults (task creation time or session average)

2. **Aggregation Levels**:
   - Daily: Sum of hours spent on tasks completed each day
   - Weekly: Total hours across 7-day periods
   - Monthly: Total hours by calendar month
   - All time: Total cumulative hours

### SQL for Hours Data
```sql
-- Daily hours calculation for a specific user
SELECT 
  DATE_TRUNC('day', completed_at) AS day,
  SUM(
    LEAST(
      EXTRACT(EPOCH FROM (completed_at - assigned_at)) / 3600, -- Convert seconds to hours
      2 -- Cap at 2 hours max per task
    )
  ) AS hours_spent
FROM cleaning_session_tasks
WHERE 
  assigned_to = :user_id
  AND status = 'done'
  AND completed_at IS NOT NULL
  AND assigned_at IS NOT NULL
  AND (completed_at - assigned_at) >= INTERVAL '1 minute' -- Minimum threshold
GROUP BY DATE_TRUNC('day', completed_at)
ORDER BY day;
```

## Visual Design

### Chart Type
An area chart with flowing, gradient-filled curves represents hours spent over time. The fluid, continuous nature of the visualization embodies the seamless integration of cleaning activities into daily life.

### Key Visual Elements
1. **Gradient Fill**: A vibrant, semi-transparent gradient flowing from primary brand color to secondary/accent color
2. **Smooth Curve**: Bezier interpolation for organic, natural transitions between data points
3. **Interactive Tooltips**: Hover/tap reveals precise hours data with task count for the selected period
4. **Responsive Design**: Adapts gracefully to mobile, tablet, and desktop viewports
5. **Time Period Selector**: Toggles between daily, weekly, monthly, and all-time views

### Color Scheme
- Primary fill: `hsl(var(--primary) / 0.7)` fading to `hsl(var(--primary) / 0.1)`
- Line stroke: `hsl(var(--primary))`
- Axis and text: `hsl(var(--foreground) / 0.8)`
- Hover highlight: `hsl(var(--accent))`

### Empty & Loading States
- **Loading**: Subtle wave animation with skeleton UI matching chart dimensions
- **Empty State**: Friendly message with illustration: "No cleaning hours recorded yet. Complete tasks to track your time!"

## User Experience

### Interactions
1. **Hover/Tap**: Reveals detailed tooltip with hours and tasks completed
2. **Time Range Selection**: Toggle buttons or dropdown to change time period view
3. **Zoom**: Optional pinch/scroll to zoom into specific time ranges
4. **Animation**: Chart animates into view on initial load with fluid transitions

### Accessibility Considerations
- **Screen Readers**: Full ARIA support and meaningful alt text
- **Keyboard Navigation**: Full keyboard support for interactive elements
- **High Contrast Mode**: Compatibility with OS high contrast settings
- **Color Blindness**: Design doesn't rely solely on color to convey information

## Technical Implementation

### Component Architecture
```typescript
interface HoursData {
  date: string;
  hours: number;
  tasks: number;
}

interface HoursChartProps {
  timeRange?: 'week' | 'month' | 'year' | 'all';
  animate?: boolean;
  height?: number;
  showControls?: boolean;
}
```

### Data Fetching
1. Create a new API endpoint at `/api/stats/hours` that:
   - Accepts query parameters for time range and aggregation level
   - Performs SQL queries with proper error handling
   - Returns formatted JSON for direct consumption by chart component

2. Implement `fetchHoursData()` in `lib/stats.ts` to:
   - Calculate hours based on the business rules above
   - Cache results appropriately to avoid redundant database calls
   - Handle edge cases and data gaps

### Chart Implementation
1. Use `recharts` or a similar React charting library for rendering
2. Custom styling to match overall application design system
3. Responsive layout with `useWindowSize` hook or CSS media queries
4. Smooth animations for transitions between time ranges

### Backend Integration
To implement the hours calculation in the existing backend, extend the `fetchUserStats` function in `lib/stats.ts`:

```typescript
export async function fetchUserStats(userId: string): Promise<UserStats> {
  const supabase = await createClient();
  
  // Existing code for points, tasks, etc.
  // ...
  
  // Calculate total hours spent
  const { data: timeData, error: timeError } = await supabase.rpc(
    "calculate_user_hours",
    { user_id: userId }
  );
  
  let hoursSpent = 0;
  
  if (!timeError && timeData) {
    hoursSpent = parseFloat(timeData.total_hours) || 0;
  } else {
    // Fallback calculation if the RPC isn't available
    const { data: taskTimes } = await supabase
      .from("cleaning_session_tasks")
      .select("assigned_at, completed_at")
      .eq("assigned_to", userId)
      .eq("status", "done")
      .not("completed_at", "is", null)
      .not("assigned_at", "is", null);
      
    if (taskTimes && taskTimes.length > 0) {
      hoursSpent = taskTimes.reduce((total, task) => {
        const start = new Date(task.assigned_at);
        const end = new Date(task.completed_at);
        const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        // Apply business rules
        if (diffHours < (1/60)) return total; // Less than 1 minute
        return total + Math.min(diffHours, 2); // Cap at 2 hours
      }, 0);
    }
  }
  
  return {
    // Other stats properties
    // ...
    hoursSpent: parseFloat(hoursSpent.toFixed(1)), // Round to 1 decimal place
  };
}
```

Create a stored procedure in the database:

```sql
CREATE OR REPLACE FUNCTION calculate_user_hours(user_id UUID)
RETURNS TABLE (total_hours NUMERIC) 
LANGUAGE SQL
AS $$
  SELECT 
    SUM(
      LEAST(
        EXTRACT(EPOCH FROM (completed_at - assigned_at)) / 3600,
        2
      )
    ) AS total_hours
  FROM cleaning_session_tasks
  WHERE 
    assigned_to = user_id
    AND status = 'done'
    AND completed_at IS NOT NULL
    AND assigned_at IS NOT NULL
    AND (completed_at - assigned_at) >= INTERVAL '1 minute';
$$;
```

## Development Roadmap

### Phase 1: Basic Implementation
- Build API endpoint for hours data
- Create basic chart component with area visualization
- Implement time period selection
- Add loading and empty states

### Phase 2: Enhancement
- Add interactive tooltips
- Implement animation effects
- Optimize mobile experience
- Add task count overlay option

### Phase 3: Advanced Features
- Allow comparison with previous periods
- Add ward/branch average comparison
- Implement zoom functionality
- Add download/share capabilities

## Performance Considerations
- Implement data caching for previously fetched time ranges
- Use date windowing to limit data points displayed
- Optimize SQL queries with proper indexes
- Implement data prefetching for adjacent time periods

## Edge Cases & Error Handling
- Handle time zones correctly for global user base
- Gracefully display partial data when some tasks have missing timestamps
- Implement retry logic for API failures
- Provide fallback visualization if chart rendering fails

## Design Mockups

```
+----------------------------------+
|                                  |
|  Hours Spent Cleaning            |
|                                  |
|  ┌────────────────────────────┐  |
|  │                          ╱ │  |
|  │                      ╱╲╱   │  |
|  │                 ╱╲╱       │  |
|  │         ╱╲    ╱           │  |
|  │      ╱╲  ╲╱               │  |
|  │    ╱                      │  |
|  └────────────────────────────┘  |
|    M   T   W   T   F   S   S     |
|                                  |
|  [ Week ] Month  Year  All-time  |
|                                  |
+----------------------------------+
```

---

This specification provides a comprehensive framework for developing a beautiful, flowing Hours Chart that enhances the user's stats page experience while effectively visualizing their cleaning contributions over time. 