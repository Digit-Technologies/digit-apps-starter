import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { libFolderFromDepName, stageProject } from '../src/pack.js';

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value));
}

async function writeLib(dir, name, dependencies = {}) {
  await writeJson(path.join(dir, 'package.json'), { name, dependencies });
  await fs.mkdir(path.join(dir, 'dist'), { recursive: true });
  await fs.writeFile(path.join(dir, 'dist', 'index.js'), '');
}

test('vendors the @heysutton SDK packages', () => {
  assert.equal(libFolderFromDepName('@heysutton/sdk'), 'sdk');
  assert.equal(libFolderFromDepName('@heysutton/sdk-react'), 'sdk-react');
  assert.equal(libFolderFromDepName('@heysutton/sdk-server'), 'sdk-server');
  assert.equal(libFolderFromDepName('@heysutton/cli'), 'cli');
});

test('maps legacy @digit/lib-* names to their old vendored folders', () => {
  assert.equal(libFolderFromDepName('@digit/lib-frontend'), 'lib-frontend');
  assert.equal(libFolderFromDepName('@digit/lib-build'), 'lib-build');
});

test('does not vendor anything else', () => {
  assert.equal(libFolderFromDepName('@heysutton/ui'), null);
  assert.equal(libFolderFromDepName('@heysutton/sdk-other'), null);
  assert.equal(libFolderFromDepName('@mui/material'), null);
});

test('a pre-rename app vendors its own @digit libs and the @heysutton tooling', async (t) => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'pack-scope-'));
  t.after(() => fs.rm(tmp, { recursive: true, force: true }));
  const root = path.join(tmp, 'app');
  const tooling = path.join(tmp, 'tooling');
  const staging = path.join(tmp, 'staging');

  // The app as packed before the rename, plus one renamed dependency.
  await writeJson(path.join(root, 'manifest.json'), { name: 'legacy' });
  await writeJson(path.join(root, 'package.json'), {
    dependencies: {
      '@digit/lib-frontend': 'file:./packages/lib-frontend',
      '@heysutton/sdk-react': '^0.1.0',
    },
    devDependencies: { '@digit/lib-build': 'file:./packages/lib-build' },
  });
  await writeLib(path.join(root, 'packages', 'lib-frontend'), '@digit/lib-frontend', {
    '@digit/lib-common': '0.0.0',
  });
  await writeLib(path.join(root, 'packages', 'lib-common'), '@digit/lib-common');
  await writeLib(path.join(root, 'packages', 'lib-build'), '@digit/lib-build');

  // The current tooling ships only the renamed packages.
  await writeLib(path.join(tooling, 'sdk-react'), '@heysutton/sdk-react', {
    '@heysutton/sdk': '0.1.0',
  });
  await writeLib(path.join(tooling, 'sdk'), '@heysutton/sdk');
  await writeLib(path.join(tooling, 'cli'), '@heysutton/cli');

  await stageProject({ root, staging, packagesDir: tooling });

  const project = path.join(staging, 'project');
  const vendored = (await fs.readdir(path.join(project, 'packages'))).sort();
  assert.deepEqual(vendored, ['cli', 'lib-build', 'lib-common', 'lib-frontend', 'sdk', 'sdk-react']);

  const pkg = JSON.parse(await fs.readFile(path.join(project, 'package.json'), 'utf8'));
  assert.deepEqual(pkg.dependencies, {
    '@digit/lib-frontend': 'file:./packages/lib-frontend',
    '@heysutton/sdk-react': 'file:./packages/sdk-react',
    '@digit/lib-common': 'file:./packages/lib-common',
    '@heysutton/sdk': 'file:./packages/sdk',
  });
  assert.deepEqual(pkg.devDependencies, {
    '@digit/lib-build': 'file:./packages/lib-build',
    '@heysutton/cli': 'file:./packages/cli',
  });
});

test('fails instead of dropping a lib it cannot find', async (t) => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'pack-scope-'));
  t.after(() => fs.rm(tmp, { recursive: true, force: true }));
  const root = path.join(tmp, 'app');
  const tooling = path.join(tmp, 'tooling');
  await writeJson(path.join(root, 'manifest.json'), { name: 'legacy' });
  await writeJson(path.join(root, 'package.json'), {
    dependencies: { '@digit/lib-frontend': 'file:./packages/lib-frontend' },
  });
  await writeLib(path.join(tooling, 'cli'), '@heysutton/cli');

  await assert.rejects(
    stageProject({ root, staging: path.join(tmp, 'staging'), packagesDir: tooling }),
    /missing package lib-frontend/,
  );
});
