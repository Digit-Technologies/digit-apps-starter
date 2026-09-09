# `@heysutton/*` shared libraries

These packages are published to NPM as **public** packages under the `@heysutton` scope for
Digit custom app builders, Studio sessions, and vibe-coded apps. They replace vendored
copies inside `app.zip` with semver'd dependencies.

| Package | NPM | Role |
| --- | --- | --- |
| `lib-common` | `@heysutton/lib-common` | Error codes, result types, pure validation |
| `lib-frontend` | `@heysutton/lib-frontend` | Theme, harness types, React hooks, error UI |
| `lib-backend` | `@heysutton/lib-backend` | Worker handler helpers, env/secrets, jobs |
| `lib-build` | `@heysutton/lib-build` | `digit-app pack` CLI |

Initial registry release: **`1.0.0`** for all four packages. **Grouped versioning:** all
`@heysutton/*` packages share one semver and release together (Release Please `linked-versions`
+ `node-workspace`). See [docs/npm-publishing.md](../docs/npm-publishing.md) for the **NPM org /
`NPM_TOKEN` setup runbook**, CI publish flow, and the **phased vendoring cutover** proposal.

**Legacy scope:** Older starter archives may still use `@digit/lib-*`. `digit-app pack` accepts
`@digit` as a vendoring alias; **`@heysutton`** is the only publish scope. See
[Pack legacy dependency scopes](../docs/npm-publishing.md#pack-legacy-dependency-scopes).
