## Context

The current daily page uses one large `DailyTracker.tsx` component to manage calendar browsing, day editing, text parsing, and weekly review. The calendar and day detail editor are rendered side by side, which creates a mismatch with the expected user flow. The current layout also makes long activity descriptions hard to edit and keeps two separate duration concepts in play: manual `studyMinutes` input and activity-derived `totalMinutes`.

The persistence layer already stores `totalMinutes`, `studyMinutes`, `rawText`, and `activities`, and the main-process `daily:upsert` handler already recalculates `totalMinutes` from activities. That means the backend is already close to an activity-driven model, but the frontend still behaves like study duration is a manual field. The parsing flow also needs to remain repeatable without silently overwriting user edits.

## Goals / Non-Goals

**Goals:**
- Present the daily module as a calendar overview first, with a dedicated day detail view entered from the calendar
- Highlight today on the calendar overview
- Allow long activity content to be fully visible and editable
- Treat activity time ranges as the source of truth for displayed and saved study duration
- Keep text parsing repeatable for the same day while requiring explicit preview application
- Preserve rollback-friendly development through milestone-based Git commits

**Non-Goals:**
- No weekly data model redesign
- No database schema expansion for this change
- No upgrade of the natural-language parser itself beyond repeatable import behavior

## Decisions

### 1. Keep one top-level `daily` entry and switch views inside the module
- Decision: retain the existing sidebar entry and implement a calendar-overview state plus a day-detail state inside `DailyTracker`
- Why: this keeps the change local to the daily module and reuses existing month/day/week APIs
- Alternative considered: introduce separate global views for daily calendar and daily detail; rejected because it would expand routing and store changes beyond the real scope

### 2. Make activity-derived duration the only duration source in the detail UI
- Decision: compute duration from the current activity drafts and save that value as `studyMinutes`
- Why: the current dual-source model is the reason summary values become inconsistent across detail, calendar, and weekly views
- Alternative considered: keep a manual override field; rejected because it preserves the synchronization bug

### 3. Replace the narrow activity content input with a multi-line editor
- Decision: use a larger layout and multi-line text input for activity content
- Why: activity content in this app behaves more like a task description than a short label
- Alternative considered: keep a one-line input and use tooltips for full text; rejected because editing would still be constrained

### 4. Keep parsing repeatable and preview-driven
- Decision: preserve `rawText`, allow repeated parse actions against the latest text, and only update the form on explicit preview application
- Why: users need to refine imported text and reparse without losing control of the current form state
- Alternative considered: clear or lock text after parsing; rejected because it recreates the same usability problem

### 5. Use milestone commits as rollback points
- Decision: keep implementation grouped into milestone-sized commits such as structure, duration sync, parsing fix, and verification
- Why: this change spans layout, state flow, and persistence behavior, so rollback points matter
- Alternative considered: one final commit after everything is done; rejected because it weakens rollback safety

## Risks / Trade-offs

- [View-state complexity increases] -> Keep overview state and detail state clearly separated and reset detail state on exit
- [Historical records may display differently] -> Use activity-derived duration for new saves and verify calendar and weekly summaries after loading existing records
- [Repeated parsing could overwrite manual edits] -> Only apply parsed data when the user explicitly clicks apply
- [Single component may remain large] -> Accept that for now and split further only if the module becomes harder to maintain
- [More frequent commits add workflow overhead] -> Keep commits aligned to meaningful, verifiable milestones

## Migration Plan

1. Implement the overview/detail layout split while preserving existing data reads
2. Switch duration display and save logic to activity-derived values
3. Keep parsing repeatable and verify that repeated import flows still work
4. Validate create, edit, delete, navigation, reload, and restart behavior
5. Roll back to the latest milestone commit if any stage introduces a blocking regression

## Open Questions

- Whether the detail header also needs a special "today" treatment, or whether highlighting today in the calendar is sufficient
- Whether activity content should remain fully expanded in all states or gain a collapsed view later