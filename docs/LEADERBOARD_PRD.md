# Ward Cleaning App - Leaderboard Product Requirements Document

## Overview
The leaderboard tracks members who complete tasks during scheduled building cleanings. It encourages friendly competition while highlighting participants with the highest point totals. Only tasks completed from the day of the scheduled cleaning should count toward leaderboard rankings.

## Goals
- Motivate members to participate in cleaning events
- Recognize top performers without exposing real names
- Provide a clear view of standings based on points earned

## Data Requirements
- Include only tasks completed on or after the scheduled cleaning day
- Users are identified by **username** and **avatar** only (no personal names)
- Each completed task contributes points toward a user's total
- Rankings are recalculated whenever tasks are completed

## Ranking Logic
1. Collect all completed tasks for the current cleaning session
2. Sum the points for each user
3. Sort users by points in descending order
4. In case of a tie, order by earliest completion time

## User Interface
### Top Placement Section
- Prominently displays the top three users
- **1st place:** centered, slightly elevated, with a gold trophy icon
- **2nd place:** left of the leader with a silver trophy icon
- **3rd place:** right of the leader with a bronze trophy icon
- Each placement shows the user's avatar, username, and total points

### Remaining Rankings
- A list begins below the top section for users ranked 4th and lower
- Each list item shows rank number, user avatar, username, and total points

## Notes
- The leaderboard view resets for each cleaning day so past sessions do not affect current standings
- Consider responsive layout adjustments for mobile screens
