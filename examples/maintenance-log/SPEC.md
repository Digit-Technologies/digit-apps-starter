# SPEC: Maintenance Log

## What it does

A CRUD app for tracking weekly machine maintenance. Users add/edit/delete records with:
machine name, serial number, whether weekly maintenance was scheduled (checkbox), date of
last inspection, and who performed it. The table shows all records with a "Scheduled" /
"Not scheduled" badge, newest first. No approval workflow or history — editing a record
overwrites it in place.

## Data & permissions

- `permissions: []` — this app reads and writes only its own data, never Digit's GraphQL API.
- Persistence: Cloudflare D1, binding `MAINTENANCE_LOG_DB` (declared in
  `public/manifest.json`). Schema in `worker/migrations/0001_init.sql`:
  `maintenance_records(id, machine_name, serial_number, scheduled, last_inspection_date,
  performed_by, created_at, updated_at)`.
- Backend routes (`worker/worker.js`, mounted at `/proxy/backend/`):
  - `GET /records` — list all, ordered by `id DESC`
  - `POST /records` — create; requires `machineName`, `serialNumber`
  - `PUT /records/:id` — update all fields
  - `DELETE /records/:id` — delete
- No env vars or secrets used.
- Gotcha: the D1 migration must be applied to the app's database in Digit (or run via
  whatever migration flow Digit provides for D1-backed apps) before the Worker will succeed —
  the Worker does not auto-create the table.

## Prompts

> can you help me create a digit app that will help me a crud app to track whether weekly
> maintencnace was scheduled. Machine, date of last inspection and who did it and the serial
> number of the machine

## Context supplied

- Built by copying the project layout/conventions from `examples/secrets-third-party`
  (closest example with a Worker backend), extended with a D1 binding and migration since
  this app persists its own data rather than calling a third-party API.
- No existing Digit object or mockup was supplied as a model.
