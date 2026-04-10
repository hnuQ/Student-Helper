---
name: desktop-release-readiness
description: Lightweight release gate for desktop apps covering build success, packaged runtime startup, path correctness, and persistence after restart.
---

# Desktop Release Readiness

Use this after dev is stable and before release.

## Must Pass
- typecheck
- build
- packaged app starts
- key pages open
- DB path works in packaged mode
- assets and preload load correctly
- data survives packaged restart

## Block Release If
- packaged app fails to start
- route opens to white screen
- data disappears after restart
- localized UI is visibly broken
