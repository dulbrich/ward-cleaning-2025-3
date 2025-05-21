# Stats Page Replacement Specification

## Overview
The current `/app/stats` page displays static information about cleaning sessions and hours. To provide a richer experience aligned with the product requirements in [STATS_PAGE.md](./STATS_PAGE.md), we will replace this page with a dynamic Stats page that surfaces a user's contributions and rank within their ward. The new page should be data-driven, mobile friendly, and encourage ongoing participation.

## Objectives
- Replace the existing static implementation at `app/app/stats/page.tsx`.
- Display the metrics and charts outlined in the PRD.
- Support loading and error states during data retrieval.
- Ensure the layout matches our design system and works on both mobile and desktop.

## Technical Requirements
### 1. API & Data Aggregation
Create helper functions or API routes to collect data from the following sources:
- `user_points` for lifetime totals and milestones.
- `cleaning_sessions` and `cleaning_session_tasks` for session history, hours, and streak calculations.
- `ward_tasks` for category breakdowns.
- `leaderboard` view or API for the user's current rank.
Cache frequent queries (such as totals and leaderboard position) for performance.

### 2. Page Structure
1. **Header Section**
   - Fetch the user's profile, total points, and leaderboard rank.
   - Display name, avatar, lifetime points, and rank prominently.
2. **Stats Cards**
   - Create a reusable `StatsCard` component.
   - Show lifetime points, tasks completed, hours spent, days participated, and streak information.
3. **Charts Section**
   - Integrate Chart.js or Recharts for three charts: tasks over time, hours per month, and task category distribution.
   - Provide loading skeletons while chart data loads.
4. **Activity Timeline**
   - List recent cleaning sessions with date, task summary, and points earned.
   - Allow filtering by time range and ward branch using dropdowns.
5. **Share Button**
   - Add a button to copy a shareable link to the user's stats.

### 3. Components & Files
- `app/app/stats/page.tsx` – main page that assembles all components.
- `components/stats/stats-card.tsx` – card component for key metrics.
- `components/stats/charts.tsx` – wrapper components for each chart type.
- `lib/stats.ts` – functions to aggregate data from Supabase.

### 4. Accessibility and Responsiveness
- Use semantic HTML and ensure components are keyboard accessible.
- Layout should adapt to small screens with a single-column layout.
- Charts must remain readable on mobile; consider legends or tooltips that collapse when space is limited.

### 5. Error Handling
- Show a friendly error message if data fails to load.
- Log detailed errors to the console for debugging.

### 6. Development Steps
1. Build aggregation functions in `lib/stats.ts`.
2. Implement `StatsCard` and chart components under `components/stats`.
3. Replace contents of `app/app/stats/page.tsx` with the new dynamic layout.
4. Add dropdown filters for time range and ward branch.
5. Wire up the share button and ensure page is responsive.
6. Test loading, error, and empty states.

### 7. Timeline
- Data functions: **1 day**
- UI components: **2 days**
- Chart integration: **1 day**
- Testing and refinement: **1 day**

_Total estimated development: 5 working days._
