---
name: source-encoding-guard
description: Lightweight guard against source-file encoding corruption in multilingual projects, especially Chinese UI apps on Windows.
---

# Source Encoding Guard

Use this when Chinese UI or config files may be damaged by mixed encodings.

## Suspect Encoding Damage When
- UI shows mojibake or replacement characters
- a text-only edit causes a route crash
- `package.json` or config files become unreadable
- one page is broken after shell-based file edits

## Rules
- standardize on UTF-8
- do not trust terminal display alone
- if a file is heavily contaminated, rewrite the whole file
- inspect related cards, forms, modals, and detail views on the same page
- re-run typecheck after cleanup

## Safe Repair
- prefer clean UTF-8 writes
- for high-risk files, use ASCII source plus `\uXXXX` strings when needed
- refresh dev before concluding the fix failed
