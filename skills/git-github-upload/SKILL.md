---
name: git-github-upload
description: Handle local Git uploads and GitHub publication for an existing project. Use when Codex needs to prepare commits, push code to a remote repository, create a new GitHub repository, switch remotes, or publish release assets such as Windows installers through GitHub CLI.
---

# Git GitHub Upload

Use this as the entry skill for Git upload tasks.

## Route Quickly
- Commit preparation: [../git-commit-prep/SKILL.md](../git-commit-prep/SKILL.md)
- Repository push and remote setup: [../github-repo-publish/SKILL.md](../github-repo-publish/SKILL.md)
- Release asset upload: [../github-release-upload/SKILL.md](../github-release-upload/SKILL.md)

## Default Flow
1. Inspect `git status --short`, current branch, and remotes.
2. Separate project files from local-only files before staging.
3. Create a focused commit or explain why no commit should be made yet.
4. Verify GitHub authentication and repository permissions before pushing.
5. Push code first, then create or update a GitHub release if artifacts are involved.

## Rules
- Do not assume the current remote is the intended destination.
- Do not push local helper files, caches, or unrelated workspace artifacts by default.
- Do not rely on username/password login for GitHub; prefer configured git credentials or `gh`.
- If repository history is corrupt and blocks pushing, create a clean export from the current tree and push that only after preserving the current content.
