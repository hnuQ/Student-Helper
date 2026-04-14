## 1. Calendar Structure

- [x] 1.1 Split `DailyTracker` into a calendar overview state and a day detail state, with calendar overview as the default entry
- [x] 1.2 Highlight today in the calendar overview while keeping month navigation and day entry working
- [x] 1.3 Add a clear return action from day detail back to the calendar overview and reset stale detail state

## 2. Activity Editing And Duration Sync

- [x] 2.1 Rework the activity editor so long activity content can be fully displayed and edited
- [x] 2.2 Replace manual study-duration editing with activity-derived live totals in the detail page
- [x] 2.3 Save `studyMinutes` and `totalMinutes` in a way that stays consistent with the current activity list

## 3. Repeatable Text Parsing

- [x] 3.1 Keep the parsing flow repeatable for the same day so a new parse replaces the old preview
- [x] 3.2 Keep parsing preview and preview application as separate actions
- [ ] 3.3 Verify manually that raw text can still be edited and reparsed after preview application

## 4. Verification And Git Flow

- [ ] 4.1 Verify create, edit, delete, navigation, reload, and restart persistence in the desktop app
- [ ] 4.2 Verify that calendar and weekly summaries use the updated activity-derived duration
- [x] 4.3 Keep milestone-based Git commits so the work remains easy to roll back