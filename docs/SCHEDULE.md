# Ward Cleaning Schedule Tab Specification

## 1. Introduction

This document outlines the specifications for the "Schedule" tab within the ward management application. The primary purpose of this section is to allow users to easily generate, view, manage, and share cleaning schedules for their assigned ward(s) or branch(es).

## 2. Goals

*   Provide a simple interface for selecting the months a ward is responsible for building cleaning.
*   Automate the generation of cleaning assignments based on a standard rotation logic.
*   Allow customization of cleaning times, both globally and for individual assignments.
*   Offer multiple views (List, Calendar, Text) for schedule consumption.
*   Enable easy sharing of the schedule (e.g., via email).
*   Support users managing multiple wards/branches.
*   Display the list of members assigned to each cleaning day, respecting do-not-contact preferences.

## 3. Features / User Stories

### 3.1. Schedule Generation

*   **As a user, I want to select the year and the specific months my ward is responsible for building cleaning.**
    *   The UI should present a way to select a year.
    *   For the selected year, the user can check/uncheck boxes corresponding to each month.
*   **As a user, I want the application to automatically generate the cleaning schedule for the selected months.**
    *   The system will identify all Saturdays within the selected months.
    *   **Grouping Logic:**
        *   The ward membership will be divided into four (4) groups based on the first letter of the last name (Assumption: Standard grouping is A-F, G-L, M-R, S-Z. *See Open Questions*).
        *   The first Saturday of the ward's cleaning block (could span multiple consecutive months) will be assigned to Group 1 (A-F).
        *   The second Saturday to Group 2 (G-L).
        *   The third Saturday to Group 3 (M-R).
        *   The fourth Saturday to Group 4 (S-Z).
        *   This rotation repeats for subsequent blocks of four Saturdays within the selected months.
        *   **5th Saturday Logic:** If a month selected for cleaning contains a fifth Saturday, the *entire* ward membership (excluding `do_not_contact`) is assigned to clean on that day.
*   **As a user, I want the default cleaning time to be 9:00 AM on Saturdays.**
*   **As a user, I want to be able to change the default cleaning start time for all generated assignments.**
    *   A setting should be available (perhaps near the month selection or in general settings) to modify this default time. Changing it should ideally update future generations or offer to update existing schedules.
*   **As a user, I want to modify the start time for a specific cleaning day after the schedule has been generated.**
    *   Each assignment in the List or Calendar view should allow for editing its specific time.

### 3.2. Schedule Viewing

*   **As a user, I want to view the generated schedule in different formats.**
    *   **List View:** A chronological list showing Date, Start Time, Assigned Group (or "Entire Ward").
    *   **Calendar View:** A standard monthly calendar interface highlighting Saturdays with cleaning assignments. Clicking on a highlighted day could show details (Time, Group).
    *   **Text View:** A simple, pre-formatted text output summarizing the schedule (e.g., "Sat, Oct 5th, 9:00 AM: Group 1 (A-F)
Sat, Oct 12th, 9:00 AM: Group 2 (G-L)...").
*   **As a user, I want a button to easily copy the Text View content to my clipboard.**
    *   A "Copy to Clipboard" button should accompany the Text View.

### 3.3. Member Assignment Details

*   **As a user, when viewing a specific cleaning assignment (e.g., clicking in List/Calendar view or in a dedicated detail section), I want to see the list of members assigned.**
    *   If a group is assigned, list all members belonging to that group (based on last name).
    *   If "Entire Ward" is assigned, list all members.
    *   **Exclusion:** Members listed in the `do_not_contact` table **must not** appear in these lists. Member data is sourced from `wardContactData` in local storage.

### 3.4. Multi-Ward Support

*   **As a user managing multiple wards/branches, I want to select which ward's schedule I am currently viewing and managing.**
    *   The application should check `wardContactData` (local storage) for the list of available wards/branches associated with the user (referencing the `ward_branches` table structure/concept).
    *   A dropdown or similar selector should be prominently displayed, likely at the top of the Schedule tab, allowing the user to switch between wards.
    *   Selecting a ward will load/display the schedule associated with that specific ward. Schedule generation and viewing actions will apply to the currently selected ward.

## 4. UI/UX Considerations

*   **Clarity:** The interface should clearly distinguish between schedule generation controls (year/month selection, default time) and schedule viewing options (List, Calendar, Text tabs).
*   **Feedback:** Provide clear visual feedback when the schedule is generated or updated. Indicate loading states if data fetching takes time.
*   **Editing:** Make inline editing of individual assignment times intuitive.
*   **Responsiveness:** The views should adapt reasonably to different screen sizes.

## 5. Data Model

*   **Existing Data:**
    *   `wardContactData` (Local Storage): Source for ward list (for multi-ward selector) and member details (names, contact info, last names for grouping). Format resembles `@ward.json`.
    *   `do_not_contact` (Database Table): Contains identifiers for members who should be excluded from assignment lists. Needs a clear key to match against `wardContactData`.
    *   `ward_branches` (Database Table): Likely contains identifiers and names for wards/branches, used to populate the multi-ward selector based on user permissions/associations derived initially into `wardContactData`.
*   **New Data / Storage:**
    *   A persistent storage mechanism is needed for the generated schedules. This could be:
        *   **New Database Table(s):**
            *   `schedules` (schedule_id PK, ward_branch_id FK, year, default_start_time)
            *   `schedule_assignments` (assignment_id PK, schedule_id FK, assignment_date, start_time, assigned_group_name) - `assigned_group_name` could be "Group 1", "Group 2", ..., "Entire Ward".
        *   **Local Storage:** Storing the generated schedule JSON directly in local storage, perhaps keyed by ward/branch ID and year. Simpler, but less robust and not easily shareable across user devices/sessions unless synced. Database storage is recommended for persistence and potential future features.
    *   The exact grouping definition (e.g., A-F, G-L, etc.) needs to be stored or defined, potentially configurable per ward.

## 6. Non-Functional Requirements

*   **Performance:** Schedule generation and view switching should be reasonably fast, even for wards with many members. Fetching member lists for specific days should not block the UI excessively.
*   **Accuracy:** Date calculations (identifying Saturdays, handling month boundaries) must be accurate. Group assignments must correctly follow the defined logic.

## 7. Open Questions / Assumptions

1.  **Grouping Definition:** Is the standard A-F, G-L, M-R, S-Z grouping acceptable, or does this need to be configurable per ward? How should edge cases (e.g., hyphenated names, names not starting with A-Z) be handled?
2.  **Data Synchronization:** How up-to-date is the `wardContactData` in local storage expected to be? How are updates to membership or the `do_not_contact` list reflected in already generated schedules? (Suggestion: Re-filtering the member list display on view is likely sufficient, rather than regenerating the core assignment).
3.  **Historical Data:** Is there a need to view schedules from past years? If so, how far back?
4.  **Schedule Conflicts:** The current spec doesn't handle potential conflicts (e.g., stake events). Is this out of scope?
5.  **Notifications:** Is there a requirement to notify members of their assignments? (Likely out of scope for this specific tab, potentially handled by a separate "Messenger" feature).
6.  **Persistence Choice:** Confirm the preferred method for storing generated schedules (Database recommended). 