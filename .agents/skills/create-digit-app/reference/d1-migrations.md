# Database migrations

Digit applies `backend/migrations/*.sql` **when you publish** — not when the app handles
requests, not during local dev, and not as a separate manual step.

## Workflow

1. Add SQL files to `src/backend/migrations/` (flat directory; no subfolders)
2. Name each file with a zero-padded number and short description:
   `0001_init.sql`, `0002_add_column.sql`, `0003_add_index.sql`
3. Declare a `database` binding in `manifest.json`
4. Run `npm run pack` and publish via MCP

**Publishing is what runs migrations.** Uploading a zip without completing publish does not
apply any SQL.

## How Digit applies them

- Files run in **filename order** (lexicographic — zero-padding keeps order correct)
- Digit records which filenames have already been applied and **skips** them on later publishes
- **First publish** runs every migration file
- **Later publishes** run **only new files** that were not applied before

## Rules

- **Never edit a migration file that has already been published.** Digit will not re-run it.
  To change the schema, **add a new file** with the next number in the sequence
  (`0003_…`, `0004_…`, etc.). Editing an old file after publish has no effect and can
  leave environments out of sync.
- **Always use the naming convention** — zero-padded numeric prefix plus a short snake_case
  description: `0001_init.sql`, not `1_init.sql` or `init.sql`.
- Keep each file **small and focused** — one logical change per file when possible.
- If a migration fails partway through, fix the SQL and **publish again**. Digit retries
  files that have not yet been recorded as successfully applied.

## What does not run migrations

- Local dev in this starter repo (`npm run dev`)
- Backend code at runtime (no auto-migrate on requests)
- Config-only updates (env vars / secrets sync without a full publish)
