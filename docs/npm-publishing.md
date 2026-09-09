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

## Consumer migration (vendored → registry)

Today, `digit-app pack` vendors `@sutton/lib-*` (and legacy `@digit/lib-*`) into
`project/packages/` inside `app.zip`. After registry publish:

1. New apps depend on semver ranges in `package.json` (`"@sutton/lib-frontend": "^1.0.0"`).
2. Pack can stop vendoring once Digit Studio / agent sessions install from the registry.
3. During migration, pack accepts **either** scope and still vendors for offline zip builds.

See open questions in the tracking PR before flipping default app templates to registry deps.

## Production-readiness checklist

- [ ] NPM org `@sutton` access and automation token (`NPM_TOKEN` secret)
- [x] **Public** package visibility on npmjs.com (decided)
- [x] **Initial semver baseline `1.0.0`** for all four packages (decided)
- [x] **Grouped versioning** — one shared semver across all four packages via `linked-versions` (decided)
- [ ] Breaking-change policy documented for app authors
- [ ] Changelog review gate on Release PR merges
- [ ] CI test gate before publish (pack smoke test today; add unit tests if/when added)
- [ ] npm provenance enabled (workflow uses `--provenance`; confirm org setting)
- [ ] Dual-publish / vendoring sunset plan for starter zip and Digit Studio
- [ ] Update `create-digit-app` skill and starter asset once registry is live
- [ ] Dependabot / Renovate for consumer repos after migration
