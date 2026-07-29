# Publish a Digit app (MCP)

Requires the org `CUSTOM_APPS` feature flag and `publish:app` permission.

## Prerequisites

1. User has **created the app in Digit** (UI). Publishing never creates apps.
2. You know the app `id` — resolve with MCP `apps`, or ask the user.
3. Built folder ready to zip: `frontend/` (+ `backend/` if declared).

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

Build the zip from the app folder so paths are `frontend/...` and optional `backend/...`
at the zip root (not `my-app/frontend/...`).

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

- Must include `frontend/manifest.json`
- `manifest.entryFile` must exist under `frontend/`
- Backend files only when `manifest.backend` is set; then `backend/worker.js` is required
- No files outside `frontend/` and `backend/`
