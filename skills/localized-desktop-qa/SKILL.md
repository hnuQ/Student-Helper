---
name: localized-desktop-qa
description: Lightweight QA for desktop apps with Chinese or other localized UI. Covers text integrity, modal coverage, and dev-first validation.
---

# Localized Desktop QA

Use this when the desktop app has localized UI.

## Check Every Affected Page
- page title
- tabs and menus
- buttons
- empty state
- form labels and placeholders
- modal titles and actions
- detail cards and panels

## Reject If
- mojibake remains
- replacement characters remain
- labels are malformed or truncated
- the page works logically but text is visibly broken

## Dev-First Rule
- stabilize in dev first
- package only after localized UI is clean
