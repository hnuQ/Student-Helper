---
name: desktop-app-debugging
description: Lightweight desktop debugging flow for white screens, preload issues, IPC mismatches, persistence bugs, encoding damage, and dev-vs-prod failures.
---

# Desktop App Debugging

Use this when a desktop app runs but behaves incorrectly.

## Debug Order
1. renderer exception
2. source encoding corruption
3. missing preload method
4. IPC mismatch
5. main-process failure
6. persistence failure
7. packaged-path difference

## White Screen
- reproduce exact route
- inspect route component and shared children
- check recent text-heavy edits
- look for undefined variables and malformed JSX

## Persistence
- confirm main handler runs
- confirm data is written
- reload
- restart app

## Avoid
- stopping when the crash disappears but data is still wrong
- assuming dev equals packaged runtime
