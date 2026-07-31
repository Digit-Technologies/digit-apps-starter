# Maintenance Log

React + MUI, themed with `@digit/app-theme`'s `DigitThemeProvider`. Tracks weekly machine
maintenance: whether it was scheduled, the machine and serial number, the date of the
last inspection, and who performed it. Records persist in the app's own D1 database via a
Cloudflare Worker backend — no Digit GraphQL data is read or written.

## Notes

- No Digit permissions required (`permissions: []`); all data is app-owned, stored in D1
  under the `MAINTENANCE_LOG_DB` binding
- CRUD via `/proxy/backend/records` (`GET`, `POST`, `PUT /records/:id`, `DELETE /records/:id`)
- Schema: `worker/migrations/0001_init.sql` — run this migration against the app's D1
  database in Digit before first use
- Local `npm run dev` has no backend, so the table/form will show request errors until
  published and backed by a real D1 binding

```bash
npm install
npm run build
```
