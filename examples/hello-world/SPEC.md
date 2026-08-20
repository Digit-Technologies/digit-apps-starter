# Hello World

## What it does

A minimal frontend-only Digit app. It greets the signed-in user when Digit returns a
username or email, otherwise “Hello, world!”. It still has no backend Worker.

## Data & permissions

- `manifest.permissions`: `[]`. The only Digit GraphQL field used is
  `currentUser { username email }` (type `CurrentUser`), which is not gated behind an
  `apiPermissions` entry — same pattern as `examples/timecard`.
- No environment variables, secrets, or backend Worker.

## Prompts

Create a minimal frontend-only hello world example that follows the Digit app conventions
and can serve as the pre-scaffolded `apps/app` in the curated starter archive.

## Context supplied

This intentionally small example is a clean starting point for agents. Add permissions
only when introducing Digit API calls, and add `src/backend/` plus a manifest `backend`
block only when server-side logic, environment variables, secrets, D1, or third-party
HTTP calls are required.
