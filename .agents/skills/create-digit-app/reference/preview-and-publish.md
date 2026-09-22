# Preview and publish behavior

Digit has two deployment channels for a custom app:

- **Preview** is an owner-only environment for the current app author.
- **Live** is the production environment visible to everyone who can access the app.

The platform keeps the channels separate with different Workers, D1 databases, R2 buckets,
sessions, and bundle pointers. A preview deployment does not change what the live app serves.
The `app.zip` produced by `digit-app pack` is channel-neutral: the same reviewed build can be
promoted without rebuilding it.

## Deployment flow

For the Digit App Builder:

```text
edit → npm run pack → publishAppZip → owner reviews preview → explicit web Publish → live
```

For standalone MCP clients, `publishApp` accepts `channel: "preview" | "live"`. The omitted
value remains `live` for backwards compatibility, so a caller must pass `channel: "preview"`
when it wants a non-production deploy.

Never describe a successful preview deployment as a production publish. If a preview deploy
fails, fix the bundle and deploy a new upload. If the user wants to ship, use the Digit web
app's explicit Publish action for the current preview build.

## What preview does and does not test

- Preview migrations run against the preview D1. Promotion applies the build's pending
  migrations to live D1; use backward-compatible expand/contract changes.
- Preview schedules are not registered, so timer-driven behavior is not production-equivalent.
  On-demand jobs use the preview job namespace when invoked by the preview app.
- Inbound webhooks are live-only and are not delivered to a preview Host. Test webhook
  handlers with signed local/unit fixtures or a deliberate live test strategy.
- Preview sessions may read Digit data, but Digit GraphQL writes are not a valid preview test.
  App-owned D1/R2 writes are isolated to preview resources.
- Preview uses the **live env vars and live secrets**. Digit Settings that edit env or
  secrets update live only; there is no preview configuration channel.
- Do not seed live data into preview by default. Live data may contain sensitive information;
  use synthetic data unless the user explicitly requests a permitted seed operation.

## Configuration and external side effects

Preview uses the **live env vars and live secrets**. There is no separate preview
configuration, inheritance step, or preview override. Digit Settings that edit env or
secrets update the live record only; preview Workers receive those same values.

Because preview always has live credentials, preview code must not assume that external
calls are harmless. Guard third-party writes, email, payments, and other irreversible
actions. Changing Settings to test credentials would also change live.

There is currently no documented app-facing `isPreview()` runtime helper. Do not infer the
channel from internal platform headers. If app behavior must differ between channels, track a
platform/SDK channel signal as a separate product change.
