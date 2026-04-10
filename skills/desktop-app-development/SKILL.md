---
name: desktop-app-development
description: Lightweight entry skill for desktop app work. Routes to architecture, bridge, debugging, localization, acceptance, and release skills with minimal overhead.
---

# Desktop App Development

Use this as the entry skill for desktop apps.

## Use When
- building a desktop feature
- debugging a broken desktop flow
- preparing acceptance or release

## Route Quickly
- Architecture: [../desktop-app-architecture/SKILL.md](../desktop-app-architecture/SKILL.md)
- Bridge and persistence: [../desktop-data-bridge/SKILL.md](../desktop-data-bridge/SKILL.md)
- Debugging: [../desktop-app-debugging/SKILL.md](../desktop-app-debugging/SKILL.md)
- Encoding safety: [../source-encoding-guard/SKILL.md](../source-encoding-guard/SKILL.md)
- Windows file writes: [../windows-utf8-file-editing/SKILL.md](../windows-utf8-file-editing/SKILL.md)
- Localized QA: [../localized-desktop-qa/SKILL.md](../localized-desktop-qa/SKILL.md)
- Acceptance: [../desktop-app-acceptance/SKILL.md](../desktop-app-acceptance/SKILL.md)
- Release: [../desktop-release-readiness/SKILL.md](../desktop-release-readiness/SKILL.md)

## Default Flow
1. Split the work across renderer, preload, main, and persistence.
2. Implement one complete vertical slice.
3. Verify in dev.
4. Debug by layer if needed.
5. Run acceptance.
6. Package only after dev is stable.

## Rules
- Do not treat renderer code in isolation.
- Do not ignore broken localized text.
- Do not release before restart persistence and packaged runtime are checked.
