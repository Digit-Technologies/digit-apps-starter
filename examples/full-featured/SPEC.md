# SPEC: Full Featured

## What it does

A tabbed reference app demonstrating Digit app platform patterns: theme/components,
shared error UI, Digit GraphQL via `DigitProxyClient`, a keyless public API through the
Worker, secrets-backed third-party calls, D1 CRUD notes, and env-driven config. Intended
as the kitchen-sink template for agents and humans learning the stack — not a production
business app.

## Data & permissions

- `permissions: ["READ_ITEM"]` — Digit API tab queries `items`
- D1 binding `FULL_FEATURED_DB` — `notes(id, title, body, created_at, updated_at)` in
  `worker/migrations/0001_init.sql`
- Env: `WELCOME_MESSAGE`, `API_BASE_URL`
- Secret: `THIRD_PARTY_API_KEY` (never returned to the UI; only a 2-char prefix for demo)
- Backend routes (via `@digit/app-backend` result helpers):
  - `GET /greeting`
  - `GET /weather`
  - `GET /external-status`
  - `GET|POST /notes`, `PUT|DELETE /notes/:id`
  - `POST /error/demo` with `{ kind: "validation" | "server" }`
- Frontend depends on `@digit/app-frontend`; Worker depends on `@digit/app-backend` and is
  bundled with `vite.backend.config.ts`

## Prompts

> can you help me create a workflow for debugging and writing apps that surface and handle
> errors well using the platform? … Can we make an example with all of the features
> available … UI and backend … form for different errors … free public API, Digit API,
> CRUD with a database … secrets too … rename package to more than theme …
> frontend package and backend package … use vite for the backend too

## Context supplied

- Evolved from discussion of skill + error helpers; packages renamed from
  `@digit/app-frontend` → `@digit/app-frontend`, plus new `@digit/app-backend`
- Copied project conventions from `examples/maintenance-log` / `secrets-third-party`
- Skill error playbook deferred until this example is dogfooded
