# Tasks Chart Specification

## Overview
The **Tasks Chart** visualizes how many tasks a user completes over time. It will replace the placeholder card labeled "Tasks Chart" on `/app/stats`. The design should be eye‑catching while remaining consistent with the rest of the Stats page. A polished chart encourages continued participation and provides quick insight into a user's cleaning activity.

## Data Source
- `cleaning_session_tasks` table
  - `assigned_to` – user ID of the person assigned the task
  - `status` – current task status (`todo`, `doing`, `done`)
  - `completed_at` – timestamp when the task was finished

## Data Query
To populate the chart for the current authenticated user, aggregate the number of completed tasks per week:

```sql
SELECT
  date_trunc('week', completed_at) AS week,
  count(*) AS tasks_completed
FROM cleaning_session_tasks
WHERE assigned_to = :user_id
  AND status = 'done'
GROUP BY 1
ORDER BY 1;
```

This query returns a row for each week containing the total tasks completed by that user. Adjust `date_trunc` to `day` or `month` for different ranges.

## Visualization
- **Chart Type**: Curved line or area chart with a soft gradient fill
- **X‑axis**: Weeks (or days) in chronological order
- **Y‑axis**: Number of tasks completed
- **Colors**: Blend the primary blue (`#3b82f6`) into the violet accent (`#8b5cf6`) for an eye‑catching gradient
- **Glow Effect**: Apply a subtle drop shadow or glow along the line to make it pop against the card background
- **Tooltips**: Show the week range and exact count on hover
- **Responsive**: The chart should gracefully scale across mobile, tablet, and desktop widths
- **Animations**: Use a gentle draw‑in animation for the line and highlight points on hover

## Integration Steps
1. Build a data‑fetching hook or function that executes the SQL query using Supabase.
2. Choose a chart library (Chart.js or Recharts) to render the line/area chart with gradient and animation support.
3. Replace the placeholder `TasksChart` component in `components/stats/charts.tsx` with the real chart. Fetch data on component mount and map the results into the chart library's format. Apply the blue‑to‑violet gradient and glow effect via CSS or the library's styling options.
4. Add loading and empty states so the card always displays helpful feedback.

## Outcome
With this chart in place, users can immediately see how their task completion trends change over time, reinforcing consistent cleaning habits and highlighting progress toward personal goals.
