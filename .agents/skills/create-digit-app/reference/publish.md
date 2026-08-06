# Publish a Digit app (MCP)

Requires the org `CUSTOM_APPS` feature flag and `publish:app` permission.

## Prerequisites

1. User has **created the app in Digit** (UI). Publishing never creates apps.
2. You know the app `id` — resolve with MCP `apps`, or ask the user.
3. `app.zip` ready via `npm run pack` (`digit-app pack` from `@digit/lib-build`). Local
   `pack` only prepares the zip; MCP `publishApp` is what goes live.

Local Digit preview is not supported yet — there is no faithful local Worker / env / D1
harness. Pack + publish is the workflow.

## Workflow

```
1. apps                     → find appId
2. generateAppUploadLink    → id, uploadUrl, uploadFields
3. HTTP POST zip to uploadUrl (multipart; NOT via MCP)
4. publishApp               → appId + appUploadLinkId
5. appPublish               → poll until succeeded | failed
```

### 1. Resolve app id

Call MCP `apps`. Match by `name`. Use the returned `id` as `appId`.

If the app does not exist, stop and ask the user to create it in Digit.

### 2. Generate upload link

Call MCP `generateAppUploadLink`. Save:

- `id` (this is both `appUploadLinkId` and later `appPublishId`)
- `uploadUrl`
- `uploadFields` — array of `{ key, value }`

### 3. Upload the zip (out-of-band)

MCP cannot carry binary bodies. POST multipart form-data:

1. Every `uploadFields` entry as a form field **first**
2. The zip as the final `file` field

Max **10MB**. If you cannot perform this HTTP request, stop and tell the user — do not call
`publishApp` against an empty upload.

Example with curl-shaped fields:

```bash
# Pseudocode — expand uploadFields into -F key=value pairs, then -F file=@app.zip
curl -X POST "$UPLOAD_URL" \
  -F "key=...from uploadFields..." \
  -F "Content-Type=...from uploadFields..." \
  # ...all other uploadFields...
  -F "file=@app.zip"
```

Build the zip with `npm run pack` (`digit-app pack`) and upload **`app.zip` as produced**
(paths at the archive root — not `my-app/frontend/...`):

```
app.zip
├── manifest.json             # Digit publish config — required at the zip root
├── frontend/                 # Digit deploy — required
│   └── index.js              # the entry, by convention
├── backend/                  # Digit deploy — when manifest.backend is set
│   ├── index.js              # single-file Worker ESM
│   └── migrations/           # optional D1 *.sql
└── project/                  # required pack artifact (source, SPEC, tooling)
    ├── src/
    ├── SPEC.md
    ├── package.json          # @digit/lib-* → file:./packages/...
    └── packages/             # vendored libs + lib-build (until registry publish)
```

**Do not modify the zip after pack.** Do not `zip -d` / re-zip to drop `project/`, and do
not hand-build a frontend/backend-only archive. Digit deploys from `frontend/` /
`backend/`; `project/` must still be present in the published artifact. If a validator
rejects `project/`, stop and report it — that is a platform/docs mismatch to fix, not
something to work around by stripping the tree.

### 4. Publish

Call MCP `publishApp` with:

- `appId` — existing app id
- `appUploadLinkId` — `id` from step 2

Returns `state: queued` (or similar in-progress). Each upload publishes **once**; to retry,
start again at `generateAppUploadLink`.

### 5. Poll

Call MCP `appPublish` with:

- `appId`
- `appPublishId` — same id as `appUploadLinkId`

Poll until `state` is `succeeded` or `failed`. Intermediate states include `queued`,
`validating`, `deployingBackend`, `publishingBundle`. On failure, report `error`, fix the
bundle, and restart at step 2.

## Zip validation reminders

**Required in the upload zip**

- `manifest.json` at the **zip root** (sibling of `frontend/` / `backend/`) and
  `frontend/index.js` (the entry, by convention)
- When `manifest.backend` is set: `backend/index.js` (plus migrations if used — these
  require a `database` binding in `manifest.backend.bindings`)
- `project/` with source, `SPEC.md`, and vendored `@digit/lib-*` (including `lib-build`)
- `manifest.permissions` use SCREAMING_SNAKE_CASE `apiPermissions.key` values (e.g.
  `READ_ITEM`) — not colon-delimited legacy strings

Digit deploy consumes `frontend/` / `backend/`; `project/` must still be present in the
same zip.
