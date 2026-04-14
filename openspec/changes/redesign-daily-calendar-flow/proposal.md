## Why

The current daily module places the calendar and day details on the same split screen. That interaction model does not match the intended workflow of "see the calendar first, then enter one day", and it also exposes several issues: activity content is clipped, study duration does not stay in sync with activities, and text parsing cannot be safely reused for repeated imports.

This project is entering another development phase, so the daily module needs a stable interaction model and a rollback-friendly Git workflow before more changes are layered on top.

## What Changes

- Change the daily module from a split-screen editor to a two-layer flow: the first screen is the calendar overview only, and clicking a date opens a dedicated detail page for that day.
- Improve the activity editor in the day detail page so long activity text can be viewed and edited without being clipped by a narrow single-line input.
- Make study duration derive from activity time ranges and update immediately after activity add, edit, or delete operations.
- Adjust the text parsing flow so users can parse and import text multiple times for the same day while keeping preview application explicit.
- Enforce a stricter Git workflow during implementation so each milestone is committed separately and can be rolled back cleanly.

## Capabilities

### New Capabilities
- `daily-calendar-detail-flow`: Defines calendar overview behavior, day navigation, detail editing, activity duration aggregation, and repeatable text import behavior for the daily module.

### Modified Capabilities

None.

## Impact

- Frontend page: `src/components/features/DailyTracker.tsx`
- Shared typing: `src/env.d.ts` may need clearer day-detail and parsing interaction constraints
- Electron main process: `electron/main/index.ts` daily handlers must remain aligned with the new duration and parsing behavior
- Data model: existing `DailyRecord` and `DailyActivity` tables remain reusable, but `totalMinutes` must stay consistent with activities
- Delivery process: implementation should be committed in milestone-sized steps rather than one large mixed commit