import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(testDir, '..', '..');
const cliEntry = path.join(packagesDir, 'cli', 'src', 'cli.js');
const fixture = path.join(testDir, 'fixtures', 'legacy-frontend-app');

function unzip(flag, zip, ...files) {
  const res = spawnSync('unzip', [flag, zip, ...files], { encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr);
  return res.stdout;
}

test('the lib-common shim re-exports the whole @heysutton/sdk runtime surface', {
  skip: !process.features.typescript && 'needs Node type stripping',
}, async () => {
  const shim = await import(path.join(packagesDir, 'lib-common', 'src', 'index.ts'));
  const sdk = await import('@heysutton/sdk');
  assert.deepEqual(Object.keys(shim).sort(), Object.keys(sdk).sort());
  assert.deepEqual(Object.keys(shim).sort(), [
    'AppErrorCode',
    'optionalString',
    'parseJsonResponse',
    'parseObject',
    'requiredString',
  ]);
  assert.equal(shim.AppErrorCode, sdk.AppErrorCode);
});

test('the lib-common shim is never published', async () => {
  const pkg = JSON.parse(
    await fs.readFile(path.join(packagesDir, 'lib-common', 'package.json'), 'utf8'),
  );
  assert.equal(pkg.name, '@digit/lib-common');
  assert.equal(pkg.private, true);
  assert.equal(pkg.version, '0.0.0');
});

// Apps packed before the rename vendor @digit/lib-frontend but not the @digit/lib-common it
// imports. Inside a starter checkout that import resolves to the shim through the root
// node_modules, and a re-pack vendors the shim and @heysutton/sdk so the zip stands alone.
test('a pre-rename frontend-only app without lib-common builds and packs inside the starter', async (t) => {
  // Inside the repo so bare imports walk up to the starter's node_modules, like apps/app.
  const root = await fs.mkdtemp(path.join(testDir, '.tmp-legacy-app-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.cp(fixture, root, { recursive: true });
  // What `npm install` links for the app's file: dependency.
  await fs.mkdir(path.join(root, 'node_modules', '@digit'), { recursive: true });
  await fs.symlink(
    path.join('..', '..', 'packages', 'lib-frontend'),
    path.join(root, 'node_modules', '@digit', 'lib-frontend'),
  );

  const res = spawnSync(process.execPath, [cliEntry, 'studio', 'pack'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(res.status, 0, `${res.stdout}\n${res.stderr}`);

  const bundle = await fs.readFile(path.join(root, 'frontend', 'index.js'), 'utf8');
  assert.match(bundle, /legacy-lib-common-resolved: not found/);

  const zip = path.join(root, 'app.zip');
  const vendored = [
    ...new Set(unzip('-Z1', zip).match(/^project\/packages\/[^/\n]+\//gm)),
  ].sort();
  assert.deepEqual(vendored, [
    'project/packages/cli/',
    'project/packages/lib-build/',
    'project/packages/lib-common/',
    'project/packages/lib-frontend/',
    'project/packages/sdk/',
  ]);
  assert.match(unzip('-Z1', zip), /^project\/packages\/sdk\/dist\/index\.js$/m);
  assert.match(
    unzip('-p', zip, 'project/packages/lib-common/src/index.ts'),
    /export \* from '@heysutton\/sdk'/,
  );
  const pkg = JSON.parse(unzip('-p', zip, 'project/package.json'));
  assert.deepEqual(pkg.dependencies, {
    '@digit/lib-frontend': 'file:./packages/lib-frontend',
    '@digit/lib-common': 'file:./packages/lib-common',
    '@heysutton/sdk': 'file:./packages/sdk',
  });
});
