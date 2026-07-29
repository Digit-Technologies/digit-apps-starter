# App spec & provenance (`SPEC.md`)

Every app directory must ship a `SPEC.md` alongside its `README.md`. `README.md` is for
humans using the app; `SPEC.md` is the recreation record — enough for a different agent,
with no memory of the original conversation, to rebuild the app from scratch using only
this skill and `SPEC.md`.

Write or update it as part of the workflow, not as an afterthought after publish.

## Required sections

### What it does

2-4 sentences: purpose, who uses it, key behaviors, and any constraints (pagination
limits, currency/unit handling, aggregation done client-side vs server-side, etc).

### Data & permissions

- Permissions declared in `manifest.json` and why each is needed
- GraphQL queries/fields relied on (root fields, filters, sort keys)
- Backend env vars / secrets and their purpose (names only — never values)
- Schema quirks or gotchas discovered while building (mismatched field names, pagination
  caps, rate limits, etc.)

### Prompts

The prompts that produced this app, verbatim, in chronological order — the original
request plus any follow-up refinement prompts. Do not paraphrase or summarize them; paste
them as given. If a prompt only makes sense with surrounding context (e.g. "user rejected
the first approach because X"), include a one-line note before it, but keep the prompt
text itself unedited.

### Context supplied

Anything given to the agent beyond the prompts that shaped the result: an existing example
app it was copied from, screenshots or mockups, links to tickets/docs, an existing Digit
object referenced as a model, schema introspection output relied on, etc.

## Committing the app

Source must be committed to this repo, not just published to Digit via MCP:

- Commit: `src/`, `worker/` (if a backend exists), `public/manifest.json`, `package.json`,
  `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `README.md`, `SPEC.md`
- Do not commit: `node_modules/`, `*.zip`, or the generated `frontend/`/`backend/` build
  output — these are gitignored and rebuild from source via `npm run build`
- If a build artifact must ship for reference, `git add -f` it explicitly — source +
  `SPEC.md` remain the source of truth
