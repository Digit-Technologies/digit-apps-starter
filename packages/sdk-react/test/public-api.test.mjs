import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(packageDir, '../..');
// The public API lives in exports.ts; index.ts (browser) and node.ts re-export it
const indexSrc = fs.readFileSync(path.join(packageDir, 'src/exports.ts'), 'utf8');
const exportSrc = indexSrc
  .split('\n')
  .filter((line) => /^\s*export\b/.test(line))
  .join('\n');

const readPkg = (folder) =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, 'packages', folder, 'package.json'), 'utf8'));

const FORBIDDEN_WRAPPERS = ['Modal', 'InputTextField', 'IconWrapper', 'InvisibleButton'];

test('root export is theme, host, hooks, AppErrorAlert, and labels', () => {
  assert.match(indexSrc, /export \{ ThemeProvider \} from "\.\/theme\/index\.js"/);
  assert.match(indexSrc, /export \{ AppHost \} from "\.\/host\/index\.js"/);
  assert.match(indexSrc, /export \{ AppErrorAlert \} from "\.\/errors\/index\.js"/);
  assert.match(indexSrc, /useApiQuery/);
  assert.match(indexSrc, /useBackendMutation/);
  assert.match(indexSrc, /LabelPrintPanel/);
});

test('keeps the old Digit* names as deprecated aliases', () => {
  assert.match(indexSrc, /export \{ DigitThemeProvider \} from "\.\/theme\/index\.js"/);
  assert.match(indexSrc, /export \{ useDigitApiQuery, useDigitApiMutation \} from "\.\/api\/index\.js"/);
  assert.match(indexSrc, /export type \{ DigitResult \} from "\.\/api\/index\.js"/);
  const themeSrc = fs.readFileSync(path.join(packageDir, 'src/theme/DigitThemeProvider.tsx'), 'utf8');
  assert.match(themeSrc, /@deprecated Use `ThemeProvider`[^\n]*\nexport const DigitThemeProvider = ThemeProvider/);
});

test('does not export design-system wrappers', () => {
  for (const name of FORBIDDEN_WRAPPERS) {
    assert.doesNotMatch(exportSrc, new RegExp(`\\b${name}\\b`));
  }
});

test('runtime SDK packages publish dist/ publicly and depend on @heysutton/sdk by version', () => {
  const sdk = readPkg('sdk');
  for (const folder of ['sdk', 'sdk-react', 'sdk-server']) {
    const pkg = readPkg(folder);
    assert.equal(pkg.private, undefined, folder);
    assert.equal(pkg.publishConfig.access, 'public', folder);
    assert.equal(pkg.publishConfig.provenance, true, folder);
    const entry = { types: './dist/index.d.ts', import: './dist/index.js' };
    // sdk-react's `node` entry skips the font stylesheet so plain Node can import it
    assert.deepEqual(
      pkg.exports,
      folder === 'sdk-react' ? { '.': { ...entry, node: './dist/node.js' } } : { '.': entry },
      folder,
    );
    if (folder !== 'sdk') {
      const dep = pkg.dependencies['@heysutton/sdk'];
      assert.equal(dep, sdk.version, folder);
      assert.doesNotMatch(dep, /^(file:|workspace:)/);
    }
  }
});

test('@heysutton/cli publishes the sutton CLI with a digit-app alias', () => {
  const pkg = readPkg('cli');
  assert.equal(pkg.name, '@heysutton/cli');
  assert.equal(pkg.private, undefined);
  assert.equal(pkg.publishConfig.access, 'public');
  assert.deepEqual(pkg.bin, {
    sutton: 'src/cli.js',
    'digit-app': 'src/digit-app.js',
  });
  assert.deepEqual(pkg.exports, { '.': './src/index.js' });
  assert.ok(pkg.dependencies.vite, 'vite is a regular dependency');
});

test('the four packages share one version; the only other package is the private lib-common shim', () => {
  const packagesDir = path.join(repoRoot, 'packages');
  const all = fs
    .readdirSync(packagesDir)
    .filter((folder) => fs.existsSync(path.join(packagesDir, folder, 'package.json')))
    .map(readPkg);
  assert.deepEqual(
    all.filter((p) => p.private).map((p) => p.name),
    ['@digit/lib-common'],
  );
  const pkgs = all.filter((p) => !p.private);
  assert.deepEqual(pkgs.map((p) => p.name).sort(), [
    '@heysutton/cli',
    '@heysutton/sdk',
    '@heysutton/sdk-react',
    '@heysutton/sdk-server',
  ]);
  assert.equal(new Set(pkgs.map((p) => p.version)).size, 1);
});
