import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildBackend } from './buildBackend.js';
import { buildFrontend } from './buildFrontend.js';
import { copyDir, copyPath, pathExists, rmrf } from './fsutils.js';
import { buildInfo } from './buildInfo.js';

const PROJECT_ALLOWLIST = [
  'src',
  'SPEC.md',
  'README.md',
  'manifest.json',
  'package.json',
  'tsconfig.json',
  'index.html',
];

function libBuildPackagesDir() {
  // packages/cli/src/pack.js → packages/
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
}

/** Build tooling folder, always vendored so the project can re-pack. */
export const BUILD_FOLDER = 'cli';

/** Runtime libs whose package entry points are built `dist/` output. */
const BUILT_LIB_FOLDERS = new Set(['sdk', 'sdk-react', 'sdk-server']);

async function resolvePackagesDir({ root }) {
  if (await pathExists(path.join(root, 'packages', BUILD_FOLDER))) {
    return path.join(root, 'packages');
  }
  const monorepo = libBuildPackagesDir();
  if (await pathExists(path.join(monorepo, BUILD_FOLDER))) {
    return monorepo;
  }
  throw new Error(
    'cannot find @heysutton/sdk* packages (expected ./packages or monorepo packages/ next to packages/cli)',
  );
}

const SDK_NAMES = new Map([
  ['@heysutton/sdk', 'sdk'],
  ['@heysutton/sdk-react', 'sdk-react'],
  ['@heysutton/sdk-server', 'sdk-server'],
  ['@heysutton/cli', 'cli'],
]);

/**
 * Folder under packages/ for a platform lib dependency, or null.
 * Legacy `@digit/lib-*` names map to their old `lib-*` folders: apps packed before the
 * rename vendor those copies themselves, and are re-packed with their own vendored tooling.
 * `@heysutton/ui` is not a lib.
 */
export function libFolderFromDepName(name) {
  if (SDK_NAMES.has(name)) return SDK_NAMES.get(name);
  const legacy = /^@digit\/(lib-[a-z]+)$/.exec(name);
  return legacy ? legacy[1] : null;
}

const DEP_SECTIONS = ['dependencies', 'devDependencies', 'peerDependencies'];

function libDepsOf(pkg) {
  const found = new Map();
  for (const section of DEP_SECTIONS) {
    for (const name of Object.keys(pkg[section] ?? {})) {
      const folder = libFolderFromDepName(name);
      if (folder) found.set(name, folder);
    }
  }
  return found;
}

/** First of `dirs` that holds packages/<folder>, or null. */
async function findLibDir(dirs, folder) {
  for (const dir of dirs) {
    const src = path.join(dir, folder);
    if (await pathExists(path.join(src, 'package.json'))) return src;
  }
  return null;
}

/**
 * Platform libs to vendor: the app's own, the build tooling, and every lib those depend
 * on. sdk-react and sdk-server depend on `@heysutton/sdk` by version; in the reseeded
 * project that version only resolves (without the registry) when sdk is vendored too and
 * linked from the project root.
 */
async function libsToVendor({ pkg, libDirs }) {
  const libs = libDepsOf(pkg);
  if (![...libs.values()].includes(BUILD_FOLDER)) libs.set('@heysutton/cli', BUILD_FOLDER);
  const queue = [...libs.values()];
  while (queue.length > 0) {
    const src = await findLibDir(libDirs, queue.shift());
    if (!src) continue;
    const libPkg = JSON.parse(await fs.readFile(path.join(src, 'package.json'), 'utf8'));
    for (const [name, dep] of libDepsOf({ dependencies: libPkg.dependencies })) {
      if (libs.has(name)) continue;
      libs.set(name, dep);
      queue.push(dep);
    }
  }
  return libs;
}

/** Point every vendored lib at its copy; transitive libs become root dependencies. */
function rewriteDigitLibDeps(pkg, libs) {
  const declared = libDepsOf(pkg);
  for (const section of DEP_SECTIONS) {
    for (const name of Object.keys(pkg[section] ?? {})) {
      const folder = libFolderFromDepName(name);
      if (folder) pkg[section][name] = `file:./packages/${folder}`;
    }
  }
  for (const [name, folder] of libs) {
    if (declared.has(name)) continue;
    const section = folder === BUILD_FOLDER ? 'devDependencies' : 'dependencies';
    pkg[section] = { ...(pkg[section] ?? {}), [name]: `file:./packages/${folder}` };
  }
  return pkg;
}

/**
 * Libs come from the app's own packages/ first, then the tooling's. An app packed before
 * the rename vendors `@digit/lib-*` under packages/lib-*, which the current tooling does
 * not ship, while the `@heysutton/*` libs it adds come from the tooling.
 */
export async function stageProject({ root, staging, packagesDir }) {
  const projectDir = path.join(staging, 'project');
  await fs.mkdir(projectDir, { recursive: true });

  for (const name of PROJECT_ALLOWLIST) {
    const src = path.join(root, name);
    if (await pathExists(src)) {
      await copyPath(src, path.join(projectDir, name));
    }
  }

  if (!(await pathExists(path.join(projectDir, 'manifest.json')))) {
    throw new Error('manifest.json is required in the project archive');
  }
  if (!(await pathExists(path.join(projectDir, 'package.json')))) {
    throw new Error('package.json is required in the project archive');
  }

  const pkgPath = path.join(projectDir, 'package.json');
  const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
  const libDirs = [...new Set([path.join(root, 'packages'), packagesDir])];
  const libs = await libsToVendor({ pkg, libDirs });

  const packagesOut = path.join(projectDir, 'packages');
  await fs.mkdir(packagesOut, { recursive: true });

  for (const folder of new Set(libs.values())) {
    const src = await findLibDir(libDirs, folder);
    if (!src) {
      throw new Error(`missing package ${folder} (looked in ${libDirs.join(', ')})`);
    }
    // Runtime libs resolve to dist/ (package.json exports). The vendored copy is installed
    // with file: in the reseeded project, where nothing rebuilds it, so dist/ must ship.
    if (BUILT_LIB_FOLDERS.has(folder) && !(await pathExists(path.join(src, 'dist', 'index.js')))) {
      throw new Error(
        `${folder} has no dist/ build under ${packagesDir}. Run \`npm run build:packages\` from the repo root, then pack again.`,
      );
    }
    // Tests are not part of the app archive.
    await copyDir(src, path.join(packagesOut, folder), {
      exclude: new Set(['node_modules', '.git', '.vite', 'test']),
    });
  }

  const rewritten = rewriteDigitLibDeps(pkg, libs);
  await fs.writeFile(pkgPath, `${JSON.stringify(rewritten, null, 2)}\n`);

  // Monorepo lockfiles point at ../../packages — omit them. Keep a lock only when
  // already vendored (deps already file:./packages/*).
  const isVendoredTree = packagesDir === path.join(root, 'packages');
  if (isVendoredTree && (await pathExists(path.join(root, 'package-lock.json')))) {
    await copyPath(
      path.join(root, 'package-lock.json'),
      path.join(projectDir, 'package-lock.json'),
    );
  }
}

function zipStaging({ staging, outZip }) {
  const result = spawnSync('zip', ['-r', outZip, '.', '-x', '*.DS_Store', '-x', '**/.DS_Store'], {
    cwd: staging,
    stdio: 'inherit',
  });
  if (result.error) {
    throw new Error(
      `failed to run zip (${result.error.message}). Install the zip CLI to pack apps.`,
    );
  }
  if (result.status !== 0) {
    throw new Error(`zip exited with code ${result.status}`);
  }
}

export async function pack({ root = process.cwd() } = {}) {
  const appRoot = path.resolve(root);

  if (!(await pathExists(path.join(appRoot, 'SPEC.md')))) {
    throw new Error('SPEC.md is required before pack (iteration context for the next agent)');
  }
  if (!(await pathExists(path.join(appRoot, 'package.json')))) {
    throw new Error('package.json not found — run sutton studio pack from the app root');
  }

  console.log('Building frontend…');
  await buildFrontend({ root: appRoot });

  console.log('Building backend (if present)…');
  const builtBackend = await buildBackend({ root: appRoot });
  if (!builtBackend) {
    console.log('No src/backend/index.js — skipping backend build');
  }

  const packagesDir = await resolvePackagesDir({ root: appRoot });
  const staging = await fs.mkdtemp(path.join(os.tmpdir(), 'digit-app-pack-'));

  try {
    // Digit expects manifest.json at the zip root; the staged copy gains "build" — the author's file is untouched.
    const manifest = JSON.parse(await fs.readFile(path.join(appRoot, 'manifest.json'), 'utf8'));
    manifest.build = await buildInfo({ packagesDir });
    await fs.writeFile(
      path.join(staging, 'manifest.json'),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
    await copyPath(path.join(appRoot, 'frontend'), path.join(staging, 'frontend'));
    if (await pathExists(path.join(appRoot, 'backend'))) {
      await copyPath(path.join(appRoot, 'backend'), path.join(staging, 'backend'));
    }
    await stageProject({ root: appRoot, staging, packagesDir });

    const outZip = path.join(appRoot, 'app.zip');
    await fs.rm(outZip, { force: true });
    zipStaging({ staging, outZip });
    console.log(`Wrote ${outZip}`);
  } finally {
    await rmrf(staging);
  }
}
