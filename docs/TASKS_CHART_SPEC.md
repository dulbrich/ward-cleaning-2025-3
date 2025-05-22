# Tasks Chart Specification

## Overview
The Tasks Chart visualizes a user's completed cleaning tasks over time. This dynamic visualization displays on the user's stats page and helps them track their cleaning progress across different time periods, encouraging consistent participation and providing a sense of accomplishment.

## Business Goals
- **Engagement**: Encourage users to complete more cleaning tasks
- **Motivation**: Provide visual feedback on cleaning activity trends over time
- **Metrics**: Support Ward/Branch leaders in understanding member participation patterns

## Data Architecture

### Data Sources
- **Primary**: `cleaning_session_tasks` table records with `completed_at` timestamps and `status` field
- **Supporting**: `cleaning_sessions` table for contextual information

### Data Model
The application will count completed tasks by day, with the following business rules:

1. **Task Counting Rules**:
   - Count each task where `status` is 'done' and `assigned_to` matches the user's ID
   - Group by date based on `completed_at` timestamp
   - Count multiple tasks completed on the same day

2. **Aggregation Levels**:
   - Daily: Count of tasks completed each day
   - Weekly: Total tasks across 7-day periods
   - Monthly: Total tasks by calendar month
   - All time: Total cumulative tasks showing long-term trends

### SQL for Tasks Data
```sql
-- Daily tasks calculation for a specific user
SELECT 
  DATE_TRUNC('day', completed_at) AS date,
  COUNT(*) AS tasks_completed
FROM cleaning_session_tasks
WHERE 
  assigned_to = :user_id
  AND status = 'done'
  AND completed_at IS NOT NULL
GROUP BY DATE_TRUNC('day', completed_at)
ORDER BY date;
```

## Visual Design

### Chart Type
A bar chart with each bar representing the number of tasks completed on that day. This provides a clear visual representation of activity patterns and frequency.

### Key Visual Elements
1. **Bar Fill**: Solid fill using the primary brand color
2. **Interactive Tooltips**: Hover/tap reveals precise task count for the selected period
3. **Responsive Design**: Adapts gracefully to mobile, tablet, and desktop viewports
4. **Time Period Selector**: Toggles between daily, weekly, monthly, and all-time views
5. **Y-Axis**: Integer values showing task counts

### Color Scheme
- Bar fill: `hsl(var(--primary))`
- Hover highlight: `hsl(var(--accent))`
- Axis and text: `hsl(var(--foreground) / 0.8)`
- Grid lines: `hsl(var(--muted-foreground) / 0.2)`

### Empty & Loading States
- **Loading**: Subtle pulse animation with skeleton UI matching chart dimensions
- **Empty State**: Friendly message with illustration: "No tasks completed yet in this period. Start cleaning to see your progress!"

## User Experience

### Interactions
1. **Hover/Tap**: Reveals detailed tooltip with tasks completed count
2. **Time Range Selection**: Toggle buttons to change time period view (Week/Month/Year/All)
3. **Animation**: Bars animate into view on initial load with a staggered rising animation

### Accessibility Considerations
- **Screen Readers**: Full ARIA support and meaningful alt text
- **Keyboard Navigation**: Full keyboard support for interactive elements
- **High Contrast Mode**: Compatibility with OS high contrast settings
- **Color Blindness**: Design doesn't rely solely on color to convey information

## Technical Implementation

### Component Architecture
```typescript
interface TasksData {
  date: string;
  tasks: number;
}

interface TasksChartProps {
  timeRange?: 'week' | 'month' | 'year' | 'all';
  animate?: boolean;
  height?: number;
  showControls?: boolean;
}
```

### Data Fetching
1. Create a new API endpoint at `/api/stats/tasks` that:
   - Accepts query parameters for time range (week, month, year, all)
   - Performs SQL queries with proper error handling
   - Returns formatted JSON for direct consumption by chart component

2. Implement data fetching logic in the TasksChart component to:
   - Fetch data based on the selected time range
   - Handle loading states and errors
   - Cache results appropriately to avoid redundant API calls

### Chart Implementation
1. Use `recharts` for rendering the bar chart
2. Implement custom styling to match overall application design system
3. Create responsive layout that adapts to different screen sizes
4. Include smooth animations for transitions between time ranges

### API Response Format
```json
[
  {
    "date": "2023-04-01",
    "tasks": 3
  },
  {
    "date": "2023-04-02",
    "tasks": 5
  },
  ...
]
```

## Development Roadmap

### Phase 1: Basic Implementation
- Create API endpoint for tasks data
- Build basic chart component with bar visualization
- Implement time period selection
- Add loading and empty states

### Phase 2: Enhancement
- Add interactive tooltips
- Implement animation effects
- Optimize mobile experience
- Add streak indicators for consecutive days

### Phase 3: Advanced Features
- Allow comparison with previous periods
- Add ward/branch average comparison
- Implement goal setting functionality
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
|  Tasks Completed                 |
|                                  |
|  ┌────────────────────────────┐  |
|  │                            │  |
|  │    ║       ║ ║  ║          │  |
|  │    ║    ║  ║ ║  ║ ║  ║     │  |
|  │    ║    ║  ║ ║  ║ ║  ║     │  |
|  │    ║    ║  ║ ║  ║ ║  ║ ║   │  |
|  │    ║    ║  ║ ║  ║ ║  ║ ║   │  |
|  └────────────────────────────┘  |
|    M   T   W   T   F   S   S     |
|                                  |
|  [ Week ] Month  Year  All-time  |
|                                  |
+----------------------------------+
```

## Next Steps
1. Implement the API endpoint and controller logic
2. Create the TasksChart component with Recharts
3. Add time range selection and state management
4. Implement responsive design and mobile optimizations
5. Add interactions and animations 