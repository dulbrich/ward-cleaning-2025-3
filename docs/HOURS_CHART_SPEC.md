# Hours Chart Specification

## Purpose
The "Hours Chart" on `/app/stats` visualizes how many hours a user has spent cleaning over time. It provides a quick overview of monthly cleaning activity and highlights engagement trends.

## Data Source
- `cleaning_sessions` – Each session has `id`, `ward_branch_id`, `session_date`, `duration` (in minutes), `created_by`, and `status`.
- `session_participants` – Links users to cleaning sessions. Contains `session_id`, `user_id`, `is_authenticated` and timestamps.

To calculate hours per month for a given user:
1. Join `cleaning_sessions` with `session_participants` on `session_id`.
2. Filter where `session_participants.user_id = :currentUserId` and `cleaning_sessions.status = 'completed'`.
3. Sum the `duration` field for each month.
4. Convert minutes to hours (divide by 60) and round to one decimal place.

## Query Example
```sql
SELECT
  date_trunc('month', cs.session_date) AS month,
  ROUND(SUM(cs.duration) / 60.0, 1) AS hours
FROM cleaning_sessions cs
JOIN session_participants sp ON sp.session_id = cs.id
WHERE sp.user_id = :currentUserId
  AND cs.status = 'completed'
GROUP BY month
ORDER BY month;
```

## Chart Design
- **Chart type**: Vertical bar chart using Chart.js or Recharts.
- **X‑axis**: Months (e.g., `Jan`, `Feb`, `Mar`). Show the last 12 months with the current month on the right.
- **Y‑axis**: Total hours cleaned during that month.
- **Appearance**:
  - Use the app's primary color for bars.
  - Bars have rounded top corners for a softer look.
  - Hover tooltip displays: `"{Month YYYY}: {hours} hours across {session_count} sessions"`.
  - Include subtle grid lines to improve readability.
- **Responsiveness**: Collapse the axis labels on small screens (use first letter of month) and allow horizontal scrolling if needed.
- **Accessibility**: Provide an alt text description summarizing the user's total hours for screen readers.

## Integration Steps
1. Add a data‑fetching function in `lib/stats.ts` to run the query above using Supabase.
2. Update `components/stats/charts.tsx` to render the bar chart when data is loaded. Show a skeleton loader while fetching.
3. Use the `HoursChart` component in `app/app/stats/page.tsx` where the placeholder currently exists.
4. Ensure the chart updates when the user changes the selected time range or ward branch (future enhancement).

## Edge Cases
- If the user has no completed sessions, show an empty state message: "No cleaning hours logged yet".
- Handle database errors gracefully by logging them and displaying a generic error message on the card.


## Sample Data
To test the chart without connecting to Supabase, use the example dataset in [docs/hours_chart_sample_data.json](./hours_chart_sample_data.json). It provides monthly totals and session counts for a fictional user.
