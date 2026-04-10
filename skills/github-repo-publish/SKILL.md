---
name: github-repo-publish
description: Publish code to GitHub from an existing local repository. Use when Codex needs to inspect or change remotes, verify `gh` authentication, create a repository under a target account, push a branch, or recover from push failures caused by permissions or broken repository history.
---

# GitHub Repo Publish

Publish the local repository to the intended GitHub remote.

## Inspect Remote State
- Run `git remote -v`.
- Check the current branch with `git branch --show-current`.
- Verify GitHub CLI availability and login status before repository operations.

## Choose the Right Remote
- Treat the existing `origin` as informational, not authoritative.
- If the target account or repository differs, add a new remote instead of mutating history blindly.
- Confirm repository permissions before pushing.

## Create and Push
- If the target repository does not exist, create it with `gh repo create`.
- Push with `git push -u <remote> <branch>`.
- If the remote already exists but is empty, prefer pushing the current branch directly.

## Recover From Push Failures
- If the push fails because of permissions, switch to a repository the authenticated account controls.
- If the push fails because of corrupted local history, export the current committed tree into a clean temporary repository and push that clean repository to GitHub.
- If the push fails because of large or generated artifacts, remove them from the commit payload and retry.

## Rules
- Do not expose tokens in output.
- Do not assume `gh` is on PATH on Windows; locate `gh.exe` if needed.
- Prefer preserving current project content over preserving problematic old history.
