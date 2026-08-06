# apps/

Digit apps live here, one folder per app. They are npm workspaces of this clone, which is
what lets `digit-app pack` find its build toolchain.

```
npm run new-app -- my-app     # scaffold apps/my-app from examples/full-featured
npm run pack -w apps/my-app   # build frontend/ (+ backend/) and write app.zip
```

Keep `src/`, `manifest.json`, `SPEC.md`, and root config in this workspace. The built
`frontend/` / `backend/` folders and `app.zip` are gitignored. This upstream starter does
not accept PRs — local commits are optional for your own clone only.
