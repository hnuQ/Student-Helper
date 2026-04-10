---
name: windows-utf8-file-editing
description: Lightweight rules for safe UTF-8 file editing from PowerShell and Windows tooling.
---

# Windows UTF-8 File Editing

Use this when editing project files from PowerShell or Windows scripts.

## Rules
- always write files with explicit UTF-8
- keep write commands simple and deterministic
- re-read important files after rewriting
- do not judge file health by terminal rendering alone

## High-Risk Files
- `package.json`
- config files
- Electron main and preload files
- React page components
- markdown and template files

## Verify After Write
1. re-open the file
2. scan for replacement characters if needed
3. run typecheck for app code
