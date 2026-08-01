#!/usr/bin/env bash
# Build deploy assets + project/ archive for Digit publish.
# Zip root: frontend/ (+ backend/), project/ (source, SPEC, tooling, vendored libs).
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

if [[ ! -f SPEC.md ]]; then
  echo "error: SPEC.md is required before pack (iteration context for the next agent)" >&2
  exit 1
fi

if [[ ! -d frontend ]] || [[ ! -f frontend/manifest.json ]]; then
  echo "error: frontend/ missing — run npm run build first" >&2
  exit 1
fi

if [[ -d "$APP_DIR/packages/lib-frontend" ]]; then
  LIB_SRC="$APP_DIR/packages"
elif [[ -d "$APP_DIR/../../packages/lib-frontend" ]]; then
  LIB_SRC="$(cd "$APP_DIR/../../packages" && pwd)"
else
  echo "error: cannot find @digit/lib-* (expected ./packages or ../../packages)" >&2
  exit 1
fi

STAGING="$(mktemp -d)"
cleanup() {
  rm -rf "$STAGING"
}
trap cleanup EXIT

cp -R frontend "$STAGING/frontend"
if [[ -d backend ]]; then
  cp -R backend "$STAGING/backend"
fi

mkdir -p "$STAGING/project"

copy_into_project() {
  local path="$1"
  if [[ -e "$path" ]]; then
    cp -R "$path" "$STAGING/project/"
  fi
}

copy_into_project src
copy_into_project SPEC.md
copy_into_project README.md
copy_into_project manifest.json
copy_into_project package.json
copy_into_project tsconfig.json
copy_into_project vite.frontend.config.ts
copy_into_project vite.backend.config.ts
copy_into_project index.html
copy_into_project scripts

if [[ ! -f "$STAGING/project/manifest.json" ]] || [[ ! -f "$STAGING/project/package.json" ]]; then
  echo "error: manifest.json and package.json are required in the project archive" >&2
  exit 1
fi

mkdir -p "$STAGING/project/packages"
for lib in lib-common lib-frontend lib-backend; do
  if [[ -d "$LIB_SRC/$lib" ]]; then
    mkdir -p "$STAGING/project/packages/$lib"
    # Prefer rsync; fall back to tar to skip node_modules.
    if command -v rsync >/dev/null 2>&1; then
      rsync -a --exclude node_modules --exclude .git --exclude '*.zip' \
        "$LIB_SRC/$lib/" "$STAGING/project/packages/$lib/"
    else
      tar -C "$LIB_SRC/$lib" \
        --exclude node_modules --exclude .git --exclude '*.zip' \
        -cf - . | tar -C "$STAGING/project/packages/$lib" -xf -
    fi
  fi
done

STAGING="$STAGING" node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');

const pkgPath = path.join(process.env.STAGING, 'project', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
  const deps = pkg[section];
  if (!deps) continue;
  for (const name of Object.keys(deps)) {
    if (!name.startsWith('@digit/lib-')) continue;
    const folder = name.slice('@digit/'.length);
    deps[name] = `file:./packages/${folder}`;
  }
}

fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
NODE

# Monorepo lockfile points at ../../packages — omit it. After extract, npm install
# creates a lock against file:./packages/*. If we already have a vendored lock, keep it.
if [[ "$LIB_SRC" == "$APP_DIR/packages" && -f package-lock.json ]]; then
  cp package-lock.json "$STAGING/project/"
fi

rm -f "$APP_DIR/app.zip"
(
  cd "$STAGING"
  zip -r "$APP_DIR/app.zip" . -x '*.DS_Store' -x '**/.DS_Store'
)

echo "Wrote $APP_DIR/app.zip"
