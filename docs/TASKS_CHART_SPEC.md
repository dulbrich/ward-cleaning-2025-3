# Tasks Chart Specification

## Overview
The **Tasks Chart** visualizes how many tasks a user completes over time. It will replace the placeholder card labeled "Tasks Chart" on `/app/stats`. The graph should be simple yet visually appealing to encourage continued participation and provide quick insight into a user's cleaning activity.

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
- **Chart Type**: Smooth line or area chart
- **X‑axis**: Weeks (or days) in chronological order
- **Y‑axis**: Number of tasks completed
- **Colors**: Use the app's accent color for the line/area fill
- **Tooltips**: Show the week range and exact count on hover
- **Responsive**: The chart should scale to mobile and desktop widths
- **Animations**: Apply subtle entrance and hover animations for polish

## Integration Steps
1. Build a data‑fetching hook or function that executes the SQL query using Supabase.
2. Choose a chart library (Chart.js or Recharts) to render the line/area chart.
3. Replace the placeholder `TasksChart` component in `components/stats/charts.tsx` with the real chart. Fetch data on component mount and map the results into the chart library's format.
4. Add loading and empty states so the card always displays helpful feedback.

## Outcome
With this chart in place, users can immediately see how their task completion trends change over time, reinforcing consistent cleaning habits and highlighting progress toward personal goals.
