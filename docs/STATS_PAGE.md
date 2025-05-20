# Ward Cleaning App - Stats Page Specification

## Overview
The Stats page provides each user with an engaging snapshot of their cleaning contributions and progress. It highlights personal achievements, encourages friendly competition, and showcases useful insights about participation in ward cleaning efforts.

## Data Sources
- **user_points** – tracks points awarded for tasks and other activities
- **cleaning_sessions** – records each cleaning event, including session date, duration, and ward branch
- **cleaning_session_tasks** – links tasks to sessions and stores completion info
- **ward_tasks** – defines task categories and point values
- **leaderboard** view or API – used to determine current ranking

## Key Metrics
1. **Lifetime Points Earned** – total points accumulated from all tasks
2. **Current Leaderboard Position** – ranking among ward members
3. **Total Tasks Completed** – count of tasks marked as done
4. **Hours Spent Cleaning** – sum of hours logged across sessions
5. **Days Participated** – number of unique cleaning sessions attended
6. **Best Streak** – longest run of consecutive weeks with at least one session
7. **Categories Completed** – breakdown of tasks by area (chapel, classrooms, restrooms, etc.)
8. **Upcoming Milestones** – next point threshold or badge to unlock

## User Interface
- **Header Section**
  - Large display of the user's name and avatar
  - Quick summary of lifetime points and current rank
- **Stats Cards**
  - Grid of card components showing key metrics (points, tasks, hours, sessions)
  - Each card uses bold typography and accent colors for emphasis
- **Charts & Visualizations**
  - Line chart of tasks completed over time
  - Bar chart of hours cleaned per month
  - Donut or pie chart for task category distribution
  - Charts should be visually appealing with smooth animations and hover tooltips
- **Activity Timeline**
  - Scrollable list of recent cleaning sessions and tasks completed
  - Includes date, session name, task details, and points earned
- **Filters**
  - Dropdown to switch between time ranges (last 30 days, year to date, custom)
  - Option to filter by ward branch if the user belongs to multiple wards
- **Sharing**
  - Button to share stats or copy a link to invite others

## Implementation Notes
- Use a chart library like Chart.js or Recharts for responsive graphs
- Aggregate data using Supabase queries or database views for performance
- Ensure all components are accessible and mobile friendly
- Provide loading states while data is fetched
- Consider caching frequent queries to reduce load

## Development Timeline
1. **Data Aggregation Functions** – 1 day
2. **UI Components and Layout** – 2 days
3. **Chart Integration** – 1 day
4. **Testing and Polish** – 1 day

_Total Estimated Time: 5 working days_
