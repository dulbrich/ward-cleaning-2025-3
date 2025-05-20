# Ward Cleaning App - Dashboard Product Requirements Document

## Overview
The Dashboard is the landing page users see after signing in. Its purpose is to provide a concise snapshot of upcoming cleaning events, personal progress, and a quick glance at the leaderboard. This page surfaces the most relevant information at a glance so users can stay engaged with ward cleaning efforts.

## Goals
- Give users immediate awareness of the next scheduled cleaning event
- Reinforce participation by showing user avatar, username, and current stats
- Highlight leaderboard position to encourage friendly competition
- Offer quick navigation to detailed pages (schedule, stats, leaderboard)

## Data Sources
- **cleaning_sessions** – upcoming events with date, time, and location
- **user_profiles** – avatar URL, username
- **user_points** – lifetime points, tasks completed, and other statistics
- **leaderboard** view – current rank and point total

## Key Components
1. **Next Cleaning Event Card**
   - Shows the soonest upcoming cleaning session
   - Displays date, time, location, and a link to the full schedule
   - Provides a "Join" or "Volunteer" button if sign‑ups are required
2. **User Summary Panel**
   - Avatar and username prominently displayed
   - Quick stats: total points, tasks completed, hours cleaned
   - Link to the full Stats page
3. **Leaderboard Snapshot**
   - Shows user's current rank and points
   - Display the top 3 users with avatars and points
   - Link to view the full Leaderboard
4. **Recent Activity Feed** (optional enhancement)
   - List of most recent cleaning sessions or tasks completed
   - Can include the user's own activity and highlights from friends
5. **Quick Links / Actions**
   - Buttons to "View Schedule", "Log Cleaning", "View Stats", etc.

## User Interface Layout
- **Header**: Simple greeting with user's avatar and username
- **Main Section**: Two‑column layout on desktop, single column on mobile
  1. Left column (or first section on mobile) shows the Next Cleaning Event Card
  2. Right column displays User Summary and Leaderboard Snapshot
- **Activity Feed** below the main section (if implemented)
- Ensure responsive design for mobile viewing

## Development Notes
- Reuse components from the Schedule, Stats, and Leaderboard pages where possible
- Data should be fetched server‑side (or using hooks) to keep the dashboard fast
- Provide loading states while data is retrieved
- Protect the page with authentication middleware so only logged‑in users can view it

## Estimated Timeline
1. Layout and component setup – 1 day
2. Data fetching and integration – 1 day
3. Polishing and responsive tweaks – 1 day

_Total Estimated Time: 3 working days_
