# Database migrations

Digit applies `backend/migrations/*.sql` during a platform deployment — not when the app
handles requests, not during local dev, and not as a separate manual step. A preview deploy
applies migrations to the preview D1. Promotion applies the build's pending migrations to the
live D1; a preview deploy never migrates live data.

## Workflow

1. Add SQL files to `src/backend/migrations/` (flat directory; no subfolders)
2. Name each file with a zero-padded number and short description:
   `0001_init.sql`, `0002_add_column.sql`, `0003_add_index.sql`
3. Declare a `database` binding in `manifest.json`
4. Run `npm run pack` and deploy a preview or publish to live

**Completing the platform deployment is what runs migrations.** Uploading a zip without
completing the deployment does not apply any SQL.

## How Digit applies them

- Files run in **filename order** (lexicographic — zero-padding keeps order correct)
- Digit records which filenames have already been applied separately in each D1 and **skips**
  them on later deployments to that channel
- The first preview deploy and the first live deployment each run every migration file for
  their own database
- Later deployments run **only new files** that were not applied in that database

## Rules

- **Never edit a migration file that has already been deployed to a channel.** Digit will not
  re-run it in that D1. To change the schema, **add a new file** with the next number in the
  sequence (`0003_…`, `0004_…`, etc.). If a migration was edited while developing only in
  preview, reset/replay the preview through the Digit UI rather than relying on the filename
  ledger to notice the edit.
- **Always use the naming convention** — zero-padded numeric prefix plus a short snake_case
  description: `0001_init.sql`, not `1_init.sql` or `init.sql`.
- Keep each file **small and focused** — one logical change per file when possible.
- Prefer backward-compatible expand/contract migrations because preview and live may be on
  different schema versions while a build is being reviewed or promoted.
- If a live/promote migration cannot capture a D1 Time Travel bookmark, promotion **fails
  closed** and does not migrate — see [publish.md](publish.md). Digit does not auto-restore
  from that bookmark if a later step fails.
- If a migration fails partway through, fix the SQL and **publish again**. Digit retries
  files that have not yet been recorded as successfully applied.

## What does not run migrations

- Local dev in this starter repo (`npm run dev`)
- Backend code at runtime (no auto-migrate on requests)
- Config-only updates (env vars / secrets sync without a full deployment)
