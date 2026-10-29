#!/usr/bin/env bash
# Packs the @heysutton tarballs, installs them into a throwaway project outside
# the repo, and checks they work as published: each package imports in plain
# Node ESM, and the `sutton` bin exits with the right codes.
# Run `npm run build:packages` first.
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

mkdir -p "$work/tarballs" "$work/project"
for pkg in sdk sdk-react sdk-server cli; do
  npm pack --silent --pack-destination "$work/tarballs" -w "@heysutton/${pkg}" >/dev/null
done

cd "$work/project"
cat >package.json <<'JSON'
{ "name": "heysutton-smoke", "private": true, "type": "module" }
JSON
# npm installs sdk-react's peers (react, @mui/material, emotion) automatically.
npm install --no-audit --no-fund --silent "$work"/tarballs/*.tgz

# sdk-server's `cloudflare:workers` builtin only exists in the Workers runtime,
# so stub it. Everything else (relative .js imports, the sdk dependency, peers)
# resolves exactly as published. sdk-react is not stubbed: Node must resolve
# its `node` entry, which leaves out the font stylesheet only Vite can load.
cat >runtime-stubs.mjs <<'JS'
import { registerHooks } from 'node:module';
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'cloudflare:workers') return { url: 'stub:cloudflare-workers', shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'stub:cloudflare-workers') {
      return { format: 'module', source: 'export class WorkerEntrypoint {}', shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
JS

check_import() {
  local pkg="$1" check="$2"
  echo "import @heysutton/${pkg}"
  node --import ./runtime-stubs.mjs --input-type=module \
    -e "const m = await import('@heysutton/${pkg}'); if (!(${check})) throw new Error('@heysutton/${pkg}: missing exports');"
}
check_import sdk 'm.AppErrorCode && m.parseObject'
check_import sdk-server 'm.createHandler && m.requireEnv'
check_import sdk-react 'm.ThemeProvider && m.AppHost'
check_import cli 'typeof m.pack === "function"'

# TypeScript consumers on moduleResolution nodenext must resolve the types too.
cat >consumer.mts <<'TS'
import { AppErrorCode } from '@heysutton/sdk';
import { createHandler } from '@heysutton/sdk-server';
import { ThemeProvider } from '@heysutton/sdk-react';
export const used = [AppErrorCode, createHandler, ThemeProvider];
TS
echo "typecheck consumer (module nodenext)"
"$repo_root/node_modules/.bin/tsc" --noEmit --strict --skipLibCheck --module nodenext --moduleResolution nodenext --target es2022 --jsx react-jsx consumer.mts

expect_exit() {
  local want="$1"; shift
  local got=0
  "$@" >/dev/null 2>&1 || got=$?
  if [ "$got" != "$want" ]; then
    echo "::error::'$*' exited $got, expected $want"
    exit 1
  fi
  echo "ok: '$*' exited $got"
}
expect_exit 0 npx --no-install sutton --help
expect_exit 0 npx --no-install sutton studio --help
expect_exit 1 npx --no-install sutton bogus

echo "Installed-package smoke test passed"
