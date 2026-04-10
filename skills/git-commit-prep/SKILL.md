---
name: git-commit-prep
description: Prepare a project for a clean Git commit. Use when Codex needs to review changed files, decide what should or should not be staged, exclude local-only artifacts, and create a focused commit message before upload.
---

# Git Commit Prep

Prepare a clean commit from the current workspace state.

## Inspect First
- Run `git status --short`.
- Check `git diff --stat` or targeted diffs for files that matter.
- Review untracked files individually before staging them.

## Stage Deliberately
- Stage tracked modifications with `git add -u` when most tracked changes belong together.
- Stage new files explicitly by path.
- Leave out local-only files such as temporary notes, build caches, generated logs, ad hoc export directories, and unrelated helper folders unless they are part of the project.

## Commit Rules
- Keep the commit scoped to one coherent outcome.
- Use a short imperative message such as `fix: dedupe email templates` or `feat: add daily tracker`.
- Do not amend or rewrite history unless the user asked for it.
- Do not auto-commit if the user only asked for analysis or review.

## Safety Checks
- Re-run `git status --short` after staging to confirm the exact payload.
- If there are unrelated dirty files, avoid staging them and say so.
