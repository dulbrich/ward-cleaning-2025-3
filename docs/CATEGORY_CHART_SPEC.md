# Category Chart Specification

## Purpose
The Category Chart visualizes how a user's completed cleaning tasks are distributed across task categories. Displayed on the `/app/stats` page, this chart encourages variety in cleaning assignments and highlights areas where the user focuses most often.

## Data Sources
- **cleaning_session_tasks** – tracks which tasks the user completed in each session
- **ward_tasks** – stores task definitions and includes a `category` field

## Data Aggregation
1. Join `cleaning_session_tasks` with `ward_tasks` on `task_id`.
2. Filter to rows where `assigned_to` equals the current user's ID and `status` is `done`.
3. Group by `category` and count the number of completed tasks in each group.

Example SQL:
```sql
SELECT wt.category, COUNT(*) AS total
FROM cleaning_session_tasks cst
JOIN ward_tasks wt ON cst.task_id = wt.id
WHERE cst.assigned_to = <USER_ID> AND cst.status = 'done'
GROUP BY wt.category
ORDER BY total DESC;
```
The resulting dataset should contain each category name and the corresponding count of completed tasks.

## Chart Design
- **Type**: Donut chart (pie chart with a hollow center) for quick comparison of proportions.
- **Colors**: Distinct colors for each category pulled from the application's theme.
- **Legend**: Display category labels and counts next to the chart. On small screens the legend may collapse beneath the chart.
- **Tooltips**: On hover/tap, show the category name, number of tasks completed, and percentage of total tasks.
- **Empty State**: If no tasks have been completed, show a friendly message and a placeholder graphic.

## Implementation Notes
- Fetch the aggregated data in `lib/stats.ts` and expose it via a function like `fetchCategoryBreakdown(userId)`.
- Use Chart.js or Recharts in `components/stats/charts.tsx` to render the donut chart.
- Provide loading skeletons while data is fetched.
- Allow optional filtering by time range in the future (e.g., last 30 days, year to date).

## User Flow
1. User navigates to `/app/stats` and the page fetches their statistics.
2. The Category Chart component requests the category breakdown and renders the donut chart once data is returned.
3. The user can hover or tap on chart segments to view detailed counts.

