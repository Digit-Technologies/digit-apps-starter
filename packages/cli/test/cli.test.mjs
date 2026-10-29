import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
const tracer = path.join(pkgDir, 'test/fixtures/trace-imports.mjs');

function cli(bin, args, { cwd = pkgDir } = {}) {
  const entry = path.join(pkgDir, pkg.bin[bin]);
  const res = spawnSync(process.execPath, ['--import', tracer, entry, ...args], {
    cwd,
    encoding: 'utf8',
  });
  return { code: res.status, stdout: res.stdout, stderr: res.stderr };
}

test('bins: sutton is primary, digit-app is a legacy alias', () => {
  assert.equal(pkg.bin.sutton, 'src/cli.js');
  assert.equal(pkg.bin['sutton-app'], undefined);
  assert.equal(pkg.bin['digit-app'], 'src/digit-app.js');
});

test('sutton --help lists studio pack, exits 0, and does not load pack or Vite', () => {
  for (const flag of ['--help', '-h', 'help']) {
    const { code, stdout, stderr } = cli('sutton', [flag]);
    assert.equal(code, 0);
    assert.match(stdout, /^Usage: sutton studio pack/);
    assert.match(stdout, /^ {2}studio pack {2}/m);
    assert.doesNotMatch(stderr, /LOADED/);
  }
});

test('sutton --version prints the package version', () => {
  for (const flag of ['--version', '-v']) {
    const { code, stdout, stderr } = cli('sutton', [flag]);
    assert.equal(code, 0);
    assert.equal(stdout.trim(), pkg.version);
    assert.doesNotMatch(stderr, /LOADED/);
  }
});

test('an unknown or missing top-level command exits non-zero with usage', () => {
  const unknown = cli('sutton', ['deploy']);
  assert.equal(unknown.code, 1);
  assert.match(unknown.stderr, /Unknown command: deploy/);
  assert.match(unknown.stderr, /Usage: sutton studio pack/);
  assert.doesNotMatch(unknown.stderr, /LOADED/);

  const none = cli('sutton', []);
  assert.equal(none.code, 1);
  assert.match(none.stderr, /Usage: sutton studio pack/);
});

test('top-level pack is not a command (it is sutton studio pack)', () => {
  const { code, stderr } = cli('sutton', ['pack']);
  assert.equal(code, 1);
  assert.match(stderr, /Unknown command: pack/);
  assert.doesNotMatch(stderr, /LOADED/);
});

test('an unknown or missing studio subcommand exits non-zero with usage', () => {
  const unknown = cli('sutton', ['studio', 'deploy']);
  assert.equal(unknown.code, 1);
  assert.match(unknown.stderr, /Unknown studio command: deploy/);
  assert.match(unknown.stderr, /Usage: sutton studio pack/);
  assert.doesNotMatch(unknown.stderr, /LOADED/);

  const none = cli('sutton', ['studio']);
  assert.equal(none.code, 1);
  assert.match(none.stderr, /Unknown studio command/);
  assert.match(none.stderr, /Usage: sutton studio pack/);
});

test('sutton studio --help prints usage and exits 0 without loading pack', () => {
  for (const flag of ['--help', '-h']) {
    const { code, stdout } = cli('sutton', ['studio', flag]);
    assert.equal(code, 0);
    assert.match(stdout, /^Usage: sutton studio pack/);
    assert.doesNotMatch(stdout, /LOADED/);
  }
});

test('studio pack rejects arguments', () => {
  const { code, stderr } = cli('sutton', ['studio', 'pack', 'extra']);
  assert.equal(code, 1);
  assert.match(stderr, /studio pack takes no arguments/);
  assert.doesNotMatch(stderr, /LOADED/);
});

function assertPackRan(res) {
  assert.equal(res.code, 1);
  assert.match(res.stderr, /LOADED .*\/src\/pack\.js/);
  assert.match(res.stderr, /SPEC\.md is required/);
}

function inEmptyDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sutton-cli-'));
  try {
    fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('studio pack loads its implementation only when it runs', () => {
  inEmptyDir((cwd) => assertPackRan(cli('sutton', ['studio', 'pack'], { cwd })));
});

test('digit-app pack runs studio pack with a one-line deprecation warning', () => {
  inEmptyDir((cwd) => {
    const res = cli('digit-app', ['pack'], { cwd });
    assertPackRan(res);
    const warnings = res.stderr.split('\n').filter((line) => /deprecated/.test(line));
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /use `sutton studio pack`/);
  });
  const { code, stdout } = cli('digit-app', ['--version']);
  assert.equal(code, 0);
  assert.equal(stdout.trim(), pkg.version);
});

test('programmatic API: import { pack } from "@heysutton/cli"', async () => {
  const mod = await import('@heysutton/cli');
  assert.equal(typeof mod.pack, 'function');
  assert.deepEqual(Object.keys(mod), ['pack']);
});
