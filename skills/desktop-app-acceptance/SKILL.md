---
name: desktop-app-acceptance
description: Lightweight acceptance checklist for desktop apps covering page rendering, bridge correctness, persistence, restart validation, and localized UI quality.
---

# Desktop App Acceptance

Use this before calling a desktop feature accepted.

## Must Verify
1. page opens without white screen
2. create works
3. edit works
4. delete works
5. switch away and back
6. reload
7. restart app
8. localized text is correct

## Cross-Layer Checks
- renderer action works
- preload API exists
- IPC matches
- data is really persisted

## Not Accepted If
- white screen remains
- data disappears after reload or restart
- packaged runtime is requested but unverified
- localized UI is still broken
