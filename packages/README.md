# `@sutton/*` shared libraries

These packages are published to NPM as **public** packages under the `@sutton` scope for
Digit custom app builders, Studio sessions, and vibe-coded apps. They replace vendored
copies inside `app.zip` with semver'd dependencies.

| Package | NPM | Role |
| --- | --- | --- |
| `lib-common` | `@sutton/lib-common` | Error codes, result types, pure validation |
| `lib-frontend` | `@sutton/lib-frontend` | Theme, harness types, React hooks, error UI |
| `lib-backend` | `@sutton/lib-backend` | Worker handler helpers, env/secrets, jobs |
| `lib-build` | `@sutton/lib-build` | `digit-app pack` CLI |

Initial registry release: **`1.0.0`** for all four packages. **Grouped versioning:** all
`@sutton/*` packages share one semver and release together (Release Please `linked-versions`
+ `node-workspace`). See [docs/npm-publishing.md](../docs/npm-publishing.md) for CI publish
flow and migration notes.

**Legacy scope:** Older docs and archives may still reference `@sutton/lib-*`. `digit-app pack`
accepts both scopes during migration.
