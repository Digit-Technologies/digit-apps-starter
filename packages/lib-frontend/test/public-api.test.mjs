import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(packageDir, '../..');
const indexSrc = fs.readFileSync(path.join(packageDir, 'src/index.ts'), 'utf8');
const exportSrc = indexSrc
  .split('\n')
  .filter((line) => /^\s*export\b/.test(line))
  .join('\n');

const FORBIDDEN_WRAPPERS = ['Modal', 'InputTextField', 'IconWrapper', 'InvisibleButton'];

test('root export is host, hooks, AppErrorAlert, and a temporary theme re-export', () => {
  assert.match(indexSrc, /export \{ AppHost \} from "\.\/host"/);
  assert.match(indexSrc, /export \{ AppErrorAlert \} from "\.\/errors"/);
  assert.match(indexSrc, /useDigitApiQuery/);
  assert.match(indexSrc, /useBackendMutation/);
  assert.match(indexSrc, /export \{ DigitThemeProvider \} from "\.\/theme"/);
  assert.match(indexSrc, /@heysutton\/ui/);
});

test('does not export design-system wrappers', () => {
  for (const name of FORBIDDEN_WRAPPERS) {
    assert.doesNotMatch(exportSrc, new RegExp(`\\b${name}\\b`));
  }
});

test('published package is @heysutton/lib-frontend, not @heysutton/ui', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
  assert.equal(pkg.name, '@heysutton/lib-frontend');
  assert.equal(pkg.private, undefined);
  assert.equal(pkg.publishConfig.access, 'public');
  assert.equal(pkg.publishConfig.provenance, true);
  assert.deepEqual(pkg.exports, {
    '.': {
      types: './dist/index.d.ts',
      import: './dist/index.js',
    },
  });
  assert.equal(pkg.dependencies['@heysutton/ui'], undefined);
  const common = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'packages/lib-common/package.json'), 'utf8'),
  );
  const backend = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'packages/lib-backend/package.json'), 'utf8'),
  );
  for (const dep of [pkg.dependencies['@heysutton/lib-common'], backend.dependencies['@heysutton/lib-common']]) {
    assert.equal(dep, common.version);
    assert.doesNotMatch(dep, /^(file:|workspace:)/);
  }
});

test('this repo does not define an @heysutton/ui package', () => {
  const packagesDir = path.join(repoRoot, 'packages');
  const names = fs
    .readdirSync(packagesDir)
    .map((folder) => {
      const manifest = path.join(packagesDir, folder, 'package.json');
      if (!fs.existsSync(manifest)) return null;
      return JSON.parse(fs.readFileSync(manifest, 'utf8')).name;
    })
    .filter(Boolean);
  assert.deepEqual(names.sort(), [
    '@heysutton/lib-backend',
    '@heysutton/lib-build',
    '@heysutton/lib-common',
    '@heysutton/lib-frontend',
  ]);
});
