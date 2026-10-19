#!/usr/bin/env bash
# Publishes the @heysutton platform libraries. Used by release-please.yml and
# publish-npm-packages.yml. Pass --dry-run for `npm publish --dry-run`.
#
# Idempotent: a package whose name@version is already on npm is skipped, so a
# re-run after a partial failure publishes only what is missing.
set -euo pipefail

dry_run=false
if [ "${1:-}" = "--dry-run" ]; then dry_run=true; fi

if [ "$dry_run" = false ] && [ -z "${NODE_AUTH_TOKEN:-}" ]; then
  echo "::error::NPM_TOKEN secret is required for real publish"
  exit 1
fi

repo_root="$(cd "$(dirname "$0")/.." && pwd)"

# sdk first: sdk-react and sdk-server depend on it.
for pkg in sdk sdk-react sdk-server cli; do
  name="@heysutton/${pkg}"
  version="$(node -p "require('${repo_root}/packages/${pkg}/package.json').version")"
  if npm view "${name}@${version}" version >/dev/null 2>&1; then
    echo "=== ${name}@${version} is already on npm, skipping ==="
    continue
  fi
  if [ "$dry_run" = true ]; then
    echo "=== npm publish --dry-run ${name}@${version} ==="
    npm publish --dry-run --access public -w "${name}"
  else
    echo "=== npm publish ${name}@${version} ==="
    npm publish --provenance --access public -w "${name}"
  fi
done
