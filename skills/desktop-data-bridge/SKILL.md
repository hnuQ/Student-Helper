---
name: desktop-data-bridge
description: Lightweight guide for renderer-preload-main data flow, IPC naming, payload discipline, and persistence verification.
---

# Desktop Data Bridge

Use this when adding or changing renderer-to-main communication.

## Required Chain
1. renderer call
2. preload exposure
3. IPC channel
4. main handler
5. DB or file write
6. response and readback

## Rules
- define request and response types first
- keep channel names exact
- validate payloads at the boundary
- verify write, reload, and restart
- resolve paths in main, not renderer

## Avoid
- UI-only verification
- unstable return shapes
- silent file or DB failures
