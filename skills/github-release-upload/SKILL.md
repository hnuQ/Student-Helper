---
name: github-release-upload
description: Publish GitHub releases and upload build artifacts. Use when Codex needs to create a tag, attach installers or packaged binaries, or manage a GitHub release for an existing repository after code has been pushed.
---

# GitHub Release Upload

Upload packaged artifacts to a GitHub release.

## Preconditions
- Ensure the repository already exists on GitHub.
- Ensure the code state intended for release has already been pushed.
- Confirm the local artifact path exists before creating the release.

## Standard Flow
1. Identify the version tag, release title, and artifact paths.
2. Use `gh release create` for a new release.
3. Upload installers, archives, or blockmaps as release assets only when they are relevant to end users.
4. Return the release URL and the local artifact path.

## Asset Rules
- Prefer final end-user artifacts such as `.exe`, `.dmg`, `.AppImage`, or signed archives.
- Do not upload local caches or unpacked build directories unless the user explicitly wants them.
- If a release already exists, use `gh release upload` instead of recreating it.

## Notes
- Keep release notes short unless the user asked for a fuller changelog.
- If packaging partially succeeds and the final installer exists, report that clearly and use the actual generated artifact.
