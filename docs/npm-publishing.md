# Publishing `@heysutton/sdk*` from this repo

The four SDK packages in `packages/` publish to npm as **public** packages under the
**`@heysutton`** org. Nothing publishes on an ordinary push to `main`. npm publish runs
only when a **Release Please release PR merges**.

This is separate from the curated starter zip (`publish-starter-asset.yml`, tags
`starter-*`).

## Packages

| npm name                | Path                  | Publishes                                                                                |
| ----------------------- | --------------------- | ---------------------------------------------------------------------------------------- |
| `@heysutton/sdk`        | `packages/sdk`        | Error codes, result types, pure validation                                               |
| `@heysutton/sdk-react`  | `packages/sdk-react`  | `ThemeProvider`, `AppHost`, API hooks, `AppErrorAlert`, label printing               |
| `@heysutton/sdk-server` | `packages/sdk-server` | Worker handlers, env/secrets, jobs, webhooks, platform API                               |
| `@heysutton/cli`        | `packages/cli`        | The `sutton` CLI (`sutton studio pack`) and `import { pack }`; `digit-app` legacy bin |

`sdk-react` and `sdk-server` depend on `@heysutton/sdk` at a plain version (`"1.0.0"` at
bootstrap). npm workspaces link the local package because the version matches. Don't put
`file:` or `workspace:` in those published dependency fields.

`@heysutton/cli` is the `sutton` command. Commands are grouped by product area, so its
public surface for 1.0.0 is `sutton studio pack`, `sutton studio --help`, `sutton --help`
and `sutton --version`; unknown commands and unknown or missing `studio` subcommands exit
non-zero. `digit-app pack` keeps working for already-built apps: it runs
`sutton studio pack` and prints a one-line deprecation warning. Code can
call `import { pack } from '@heysutton/cli'`. Subcommands load their own code only when
they run. Vite is a regular dependency, so installing `@heysutton/cli` brings the build
toolchain with it. There's no separate build library.

Starter apps and examples keep `file:` dependencies. `pack` vendors the SDK packages an
app uses into `project/packages/`, plus `@heysutton/cli` and anything those depend on (so an
app that only lists `sdk-react` also gets `sdk`). Runtime packages are vendored with
their built `dist/`: the reseeded project installs them with `file:` and nothing
rebuilds them there. Pack fails with a clear message if `dist/` is missing (run
`npm run build:packages`). Apps packed before the rename still import `@digit/lib-*`;
they carry their own vendored `lib-*` copies and tooling and keep working unchanged.
Old packs only vendored libs an app listed directly, so frontend-only apps often lack
`lib-common`. The starter keeps a private, never-published `packages/lib-common`
(`@digit/lib-common`) that re-exports `@heysutton/sdk`, so those apps still build inside a
starter checkout, and `pack` vendors it plus `sdk` so one re-pack makes the zip self-contained.
It is not in `release-please-config.json` or `scripts/publish-packages.sh`.

## Versions

[Release Please](https://github.com/googleapis/release-please) manifest mode:

- `release-please-config.json`: one component per package, `node-workspace`
  (`merge: false`) and a `linked-versions` group `@heysutton/sdk`, so all four share one
  semver and release in one PR. `separate-pull-requests` is on so other components in
  this repo (the agent plugin) get their own release PRs.
- `.release-please-manifest.json`: last released version of each package (`1.0.0`).
- `bootstrap-sha` keeps the first changelog to commits after the setup, not the repo's
  whole history.

A `feat:` or `fix:` commit touching `packages/` opens or updates one release PR titled
`chore(main): release @heysutton/sdk libraries`. `feat:` bumps minor, `fix:` patch,
`feat!:` / `BREAKING CHANGE:` major. Merging **that** PR publishes. Merging this setup PR
does not publish by itself.

## Trusted publishing

CI publishes with npm trusted publishing (OIDC). There's no npm token: the job's
`id-token: write` lets GitHub mint a short-lived token naming this repo and workflow, and npm
accepts it only for packages that list that repo and workflow as a trusted publisher.

npm only lets you add a trusted publisher to a package that already exists, so the `1.0.0`
baseline is published once by hand, by an `@heysutton` org member (the `sutton_dev` bot
account), from a clean checkout of `main`:

```bash
npm ci && npm run build:packages
npm publish --access public -w @heysutton/sdk
npm publish --access public -w @heysutton/sdk-react
npm publish --access public -w @heysutton/sdk-server
npm publish --access public -w @heysutton/cli
```

Publish `sdk` first, since `sdk-react` and `sdk-server` depend on it. Leave off
`--provenance` (it only works in CI), so don't use `scripts/publish-packages.sh` for this.

Then register the trusted publisher on each of the four packages, on the package's Settings
page or with `npm trust github @heysutton/<pkg> --file release-please.yml --repo hey-sutton/sdk --allow-publish`.
Owner, repository and workflow file are case-sensitive, and there is no environment. A new
configuration expires if no publish uses it within 48 hours, so add it shortly before merging
a release PR. Add `publish-npm-packages.yml` the same way only when you're about to run it.

## Cadence

| Trigger                                                                | What happens on npm                                                                    |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Push or merge to `main` that does not create a release                 | No publish. Release Please may open or update the release PR.                          |
| Merge the Release Please release PR                                    | Same workflow publishes all four `@heysutton/sdk*` packages.                            |
| `workflow_dispatch` on Publish NPM packages, `dry_run: true` (default) | Dry-run only.                                                                          |
| `workflow_dispatch` with `dry_run: false`                              | Real publish via trusted publishing. Use for an emergency republish.                     |

A `release: published` workflow would not run: Release Please creates the GitHub Release
with `GITHUB_TOKEN`, and GitHub does not start workflows from events that token produces.
Publish is a second job in [`.github/workflows/release-please.yml`](../.github/workflows/release-please.yml),
gated on the `packages/sdk` release.

## Tags and the starter zip

SDK tags look like `sdk-v1.1.0`, `sdk-react-v1.1.0`, and so on. They never become GitHub's
"latest" release, not even briefly: digit-api downloads the starter zip from
`/releases/latest`. Release Please can't pass `make_latest: false`, so it creates
component releases as drafts (drafts are never latest) with the tag pushed up front
(`draft` + `force-tag-creation`). The workflow then publishes each draft with
`--latest=false`. The starter asset workflow keeps passing `--latest` for `starter-*`.

## Build

TypeScript packages compile to `dist/` (`npm run build:packages`). `@heysutton/cli`
ships `src/`. Root `prepare` runs the build on `npm install`, including in a downloaded
starter zip, so `pack` can resolve and vendor `dist/`. `files` for the TypeScript
packages is `dist` plus `README.md`, and the export map is the package root only.

## Local check

```bash
npm ci
npm test
npm run build:packages
npm run verify:packages
npm publish --dry-run --access public -w @heysutton/sdk
npm publish --dry-run --access public -w @heysutton/sdk-react
npm publish --dry-run --access public -w @heysutton/sdk-server
npm publish --dry-run --access public -w @heysutton/cli
```

Pull requests run [`.github/workflows/test-packages.yml`](../.github/workflows/test-packages.yml):
`npm test` (node tests plus the `sdk-react` Vitest suite), build, and `npm publish --dry-run`.
