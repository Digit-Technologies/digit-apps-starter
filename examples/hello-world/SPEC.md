# Hello World

## What it does

A minimal frontend-only Digit app. It verifies the required React, MUI, Digit theme,
mount-point, manifest, and pack conventions without including API calls or a backend.

## Data & permissions

The app uses no external data, Digit API operations, permissions, environment variables,
secrets, or backend Worker.

## Prompts

Create a minimal frontend-only hello world example that follows the Digit app conventions
and can serve as the pre-scaffolded `apps/app` in the curated starter archive.

## Context supplied

This intentionally small example is a clean starting point for agents. Add permissions
only when introducing Digit API calls, and add `src/backend/` plus a manifest `backend`
block only when server-side logic, environment variables, secrets, D1, or third-party
HTTP calls are required.
