---
name: desktop-app-architecture
description: Lightweight architecture guide for desktop apps. Defines renderer, preload, main, persistence, and shared-type boundaries.
---

# Desktop App Architecture

Use this when designing or refactoring desktop app structure.

## Split Responsibilities
- Renderer: UI and local interaction
- Preload: narrow bridge only
- Main: privileged orchestration
- Data layer: DB and file logic
- Shared types: request and response shapes

## Build Features Vertically
For each feature, wire:
1. UI
2. preload method
3. main handler
4. storage or side effect
5. readback path

## Avoid
- business logic in preload
- filesystem work in renderer
- ad hoc return shapes
- UI coupled directly to persistence details
