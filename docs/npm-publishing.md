# Publishing `@sutton/*` libraries to NPM

This document describes how shared Digit app-builder libraries leave this monorepo and
land on NPM. **All `@sutton/*` packages publish as public** on [npmjs.com](https://www.npmjs.com/)
(MIT license). The **initial release is `1.0.0`** for all four packages. **Nothing in this
repo publishes automatically until release secrets and org access are configured.**

## Packages

| NPM name | Path | Purpose |
| --- | --- | --- |
| `@sutton/lib-common` | `packages/lib-common` | Error codes, result types, pure validation |
| `@sutton/lib-frontend` | `packages/lib-frontend` | MUI theme, harness types, React data hooks, error UI |
| `@sutton/lib-backend` | `packages/lib-backend` | Worker handler helpers, env/secrets, jobs, webhooks |
| `@sutton/lib-build` | `packages/lib-build` | `digit-app pack` CLI and shared Vite configs |

Dependency graph:

```
lib-common (no internal deps)
    ↑
lib-frontend, lib-backend
lib-build (standalone tooling)
```

## Versioning — Release Please (manifest mode, grouped)

We use [Release Please](https://github.com/googleapis/release-please) in **manifest mode**
(same family of tooling used on `digit-api`):

- `release-please-config.json` — per-package release settings, plugins, and grouped release PR title
- `.release-please-manifest.json` — last released version for each package path

**Grouped versioning (decided):** all four `@sutton/*` packages share **one semver** and bump
together. Release Please uses the `node-workspace` plugin (updates local dependency refs in
`package.json`) plus the `linked-versions` plugin (group `@sutton/libraries`) so
`lib-common`, `lib-frontend`, `lib-backend`, and `lib-build` always release at the same
version (for example `1.2.0` on all four).

On every push to `main`, the `release-please` workflow opens or updates a **single Release PR**
that bumps all linked versions, updates changelogs, and refreshes the manifest. Merging that PR
creates GitHub releases and tags (for example `lib-common-v1.2.0`, all at the same version).

Commit messages on `main` should follow [Conventional Commits](https://www.conventionalcommits.org/)
so Release Please can infer semver bumps (`feat:` → minor, `fix:` → patch, `feat!:` / `BREAKING CHANGE:` → major).

### Why Release Please (vs alternatives)

| Option | Fit for this repo |
| --- | --- |
| **Release Please (chosen)** | Already familiar on `digit-api`; manifest mode with `node-workspace` + `linked-versions` keeps all four `@sutton/lib-*` packages on one shared semver; generates changelogs and a single release PR with no manual version edits. |
| Changesets | Excellent for independent per-package semver, but adds author overhead (changeset files on every PR) and a second merge step. Not needed now that grouped versioning is decided. |
| Manual tags + `npm version` | Minimal tooling, but error-prone in a monorepo and no changelog discipline. |
| Lerna / Nx release | Heavier infra than needed for four small packages with no build graph orchestration beyond `npm run build:packages`. |

## Publish workflow (release time only)

The `publish-npm-packages` workflow is **not** wired to run on every merge. It runs when:

1. A GitHub **Release** is published (typically by Release Please after the Release PR merges), or
2. A maintainer triggers **workflow_dispatch** (defaults to `dry_run: true`).

Steps:

1. Install dependencies from the repo root (`npm ci`).
2. `npm run build:packages` — compile TS libraries to `dist/` (`lib-build` ships plain JS from `src/`).
3. `npm run verify:packages` — smoke-test that `hello-world` still packs.
4. For each package under `packages/*` with a `"name": "@sutton/..."`:
   - `npm publish --dry-run --access public` when `dry_run=true`
   - `npm publish --provenance --access public` when `dry_run=false`

Scoped packages require an explicit `--access public` on first publish (also set in each
package's `publishConfig.access`). CI and local dry-runs use the same flag so publish
behavior matches release time.

### Who triggers publish?

| Step | Actor |
| --- | --- |
| Day-to-day merges to `main` | Release Please bot (opens Release PR only) |
| Merge Release PR | Maintainer (creates GitHub release + tag) |
| NPM publish | GitHub Actions on `release: published`, using `NPM_TOKEN` |

Use workflow_dispatch with `dry_run: false` only for emergency republish/debug after the
Release exists.

### Required secrets (not configured in this PR)

| Secret | Purpose |
| --- | --- |
| `NPM_TOKEN` | Automation token with publish access to `@sutton/*` on npmjs.com |

Optional hardening:

- `NPM_CONFIG_PROVENANCE=true` (enabled via `--provenance` flag in the workflow)
- OIDC trusted publishing on npm (replace long-lived token when org policy allows)

## Local dry-run

```bash
npm ci
npm run build:packages
npm publish --dry-run --access public -w @sutton/lib-common
npm publish --dry-run --access public -w @sutton/lib-frontend
npm publish --dry-run --access public -w @sutton/lib-backend
npm publish --dry-run --access public -w @sutton/lib-build
```

## Phased vendoring cutover (proposal for review)

Today, `digit-app pack` copies `@sutton/lib-*` (and legacy `@digit/lib-*`) into
`project/packages/` inside every `app.zip`. Registry publish does **not** require an immediate
stop to vendoring. The plan below is a **proposal for Sean to review** — no phase dates or
stop-at-first-publish assumption.

### Risks to manage across all phases

| Risk | Mitigation |
| --- | --- |
| **Version skew** — vendored copy in zip ≠ semver in `package.json` | Grouped `@sutton/*` releases (one shared version); in Phase 2+, pack should pin vendored copies to the same version as registry deps when both paths exist |
| **Dual-publish drift** — starter zip, Studio, and NPM disagree on lib versions | Record `starterRelease` / app manifest lib version; smoke-test pack after each `@sutton` release |
| **Offline / air-gapped zip rebuild** — no registry in some agent sessions | Keep vendoring through Phase 2; only remove in Phase 3 when consumers can install from NPM |
| **Breaking changes** — app pinned to old vendored libs while registry moved on | Semver + changelog on Release PR; major bumps require explicit Studio/template updates |

### Phase 1 — Registry live, vendoring unchanged (default after first publish)

**Goal:** `@sutton/*` exists on NPM at the grouped semver (starting **1.0.0**); generated apps
still get vendored libs in `app.zip` exactly as today.

| | |
| --- | --- |
| **Pack behavior** | Continue copying all depended `@sutton/lib-*` (+ `lib-build`) into `project/packages/` |
| **App `package.json`** | Examples / starter still use `file:../../packages/...` in monorepo; published apps keep vendored `file:./packages/...` after pack |
| **Optional dual-path** | Early adopters may add registry semver ranges in source *before* pack (allowlist / feature flag in Studio) — pack still vendors for zip portability unless explicitly opted out |
| **Success criteria** | `npm publish` dry-run green; `npm run verify:packages` passes; at least one manual install of `@sutton/lib-frontend@1.0.0` from npmjs.com in a clean project |
| **Rollback** | Unpublish is not reliable on NPM — rollback = publish a patch release or document “do not use” version; vendoring path unchanged so apps keep working without registry |

### Phase 2 — Registry-first templates, vendored fallback

**Goal:** New apps and Digit Studio scaffolds declare **`@sutton/*` semver ranges** (e.g.
`"@sutton/lib-frontend": "^1.0.0"`) as the source of truth; pack still vendors matching
versions into the zip for offline re-pack and agent iteration.

| | |
| --- | --- |
| **Templates / skill** | `create-digit-app` skill + `examples/*` + starter `apps/app` use registry semver in `package.json` (not `file:` to monorepo packages) |
| **Pack behavior** | Resolve registry version at pack time (or pin to lockfile), **then** copy those exact versions into `project/packages/` so vendored tree matches declared semver |
| **Starter zip** | May still ship `packages/` source for monorepo dev, but consumer apps target NPM |
| **Success criteria** | Fresh scaffold → `npm install` → `npm run pack` with no monorepo `file:` links; vendored folders in zip match `package-lock.json` / pinned `@sutton/*` versions; Studio builder session smoke test |
| **Rollback** | Revert templates to `file:` / full vendoring-only deps; pack ignore registry resolution flag |

### Phase 3 — Stop bundling vendored libs into `app.zip`

**Goal:** `project/` inside `app.zip` contains source + tooling only; libs come from NPM at
Digit deploy or agent restore time.

| | |
| --- | --- |
| **Pack behavior** | Stop copying `project/packages/`; `package.json` + lockfile (or shrinkwrap) list `@sutton/*` registry deps only |
| **Prerequisites** | Digit Studio and starter consumers install from NPM in the harness; migration note for existing apps (“re-pack with registry deps”); network/registry available in builder sessions |
| **Success criteria** | `app.zip` has no `project/packages/lib-*`; unpack → `npm ci` → `npm run pack` succeeds; no duplicate React/MUI from vendored + hoisted installs |
| **Rollback** | Re-enable Phase 2 vendoring in `lib-build` behind a manifest or pack flag (`"vendorLibs": true`) until all active apps migrate |

### What stays open (not decided in this PR)

- **Phase timing and gates** — proposal only; Sean to confirm when to enter Phase 2 / 3
- **NPM `@sutton` org ownership and `NPM_TOKEN`** for CI publish (see checklist below)

## Production-readiness checklist

- [ ] NPM org `@sutton` access and automation token (`NPM_TOKEN` secret)
- [x] **Public** package visibility on npmjs.com (decided)
- [x] **Initial semver baseline `1.0.0`** for all four packages (decided)
- [x] **Grouped versioning** — one shared semver across all four packages via `linked-versions` (decided)
- [ ] Breaking-change policy documented for app authors
- [ ] Changelog review gate on Release PR merges
- [ ] CI test gate before publish (pack smoke test today; add unit tests if/when added)
- [ ] npm provenance enabled (workflow uses `--provenance`; confirm org setting)
- [ ] **Phased vendoring cutover** — proposal documented above; awaiting review (no stop date)
- [ ] Update `create-digit-app` skill and starter asset when Phase 2 begins
- [ ] Dependabot / Renovate for consumer repos after migration
