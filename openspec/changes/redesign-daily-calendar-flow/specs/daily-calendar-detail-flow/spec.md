## ADDED Requirements
### Requirement: Calendar overview is the default daily entry
The system SHALL present the daily module as a calendar overview page by default. The overview page MUST display the current month, highlight today's date, and allow the user to open a specific day's detail page by selecting a date cell.
#### Scenario: Open daily module
- **WHEN** the user enters the daily module from the sidebar
- **THEN** the system shows the month calendar overview instead of an already-open detail editor
#### Scenario: Highlight today on the calendar
- **WHEN** the calendar overview renders the current month
- **THEN** the system visually distinguishes today's date from other dates even when it is not the selected date
#### Scenario: Enter day detail from the calendar
- **WHEN** the user clicks a date cell on the calendar overview
- **THEN** the system opens that date's detail page and loads the saved record for the selected day if one exists
### Requirement: Day detail page supports complete activity content editing
The system SHALL provide a dedicated day detail page for the selected date. The activity editor on that page MUST allow long content to be fully viewed and edited without being truncated by a fixed narrow single-line layout.
#### Scenario: View long activity content
- **WHEN** a saved activity contains long descriptive text
- **THEN** the detail page shows the content with wrapping or multi-line presentation so the full text remains readable
#### Scenario: Edit long activity content
- **WHEN** the user edits an activity with long text
- **THEN** the input control allows the user to review and modify the entire content without horizontal clipping
### Requirement: Study duration is derived from activities
The system SHALL treat activity time ranges as the source of truth for daily study duration. When activities are added, removed, or edited, the displayed total duration MUST update immediately, and saving the day record MUST persist a duration value consistent with the current activities.
#### Scenario: Add a new activity
- **WHEN** the user adds an activity with a valid start time and end time
- **THEN** the detail page recalculates and displays the updated total duration immediately
#### Scenario: Remove an activity
- **WHEN** the user deletes an existing activity from the detail page
- **THEN** the detail page recalculates the total duration and removes the deleted activity from the next save
#### Scenario: Save daily record after duration changes
- **WHEN** the user saves a day record after modifying activities
- **THEN** the persisted day summary used by calendar and weekly views reflects the recalculated total duration
### Requirement: Text parsing can be repeated for the same day
The system SHALL allow the user to parse imported text for the same date multiple times. Each parse attempt MUST generate a fresh preview from the current text input, and applying a parse result MUST require an explicit user action.
#### Scenario: Re-parse updated text
- **WHEN** the user edits the raw text after a previous parse and clicks parse again
- **THEN** the system replaces the previous preview with a new preview generated from the latest text
#### Scenario: Apply parse preview explicitly
- **WHEN** a parse preview is available
- **THEN** the system updates the form fields only after the user chooses to apply the preview
#### Scenario: Keep raw text available after applying preview
- **WHEN** the user applies a parse preview to the day form
- **THEN** the original text area remains available for further editing and later re-parsing