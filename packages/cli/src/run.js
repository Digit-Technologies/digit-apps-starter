import fs from 'node:fs';

export function version() {
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  return pkg.version;
}

export function usage() {
  return `Usage: sutton studio pack

Commands:
  studio pack  Build frontend/ (+ backend/ when present) and write app.zip

Options:
  -h, --help     Show this help
  -v, --version  Show the version

studio pack writes the same app.zip for a Sutton draft or a published deployment. There is
no local runtime: the platform injects Workers, env/secrets, and D1.
`;
}

/**
 * Runs the CLI and returns the exit code. `stdout` / `stderr` are injectable for tests.
 * `pack` is imported lazily so `--help` / `--version` never load Vite.
 * @param {string[]} argv arguments after the binary name
 */
export async function run(
  argv,
  { cwd = process.cwd(), stdout = process.stdout, stderr = process.stderr } = {},
) {
  const [command, subcommand, ...rest] = argv;

  if (command === '-h' || command === '--help' || command === 'help') {
    stdout.write(usage());
    return 0;
  }
  if (command === '-v' || command === '--version') {
    stdout.write(`${version()}\n`);
    return 0;
  }
  if (!command) {
    stderr.write(usage());
    return 1;
  }
  if (command !== 'studio') {
    stderr.write(`Unknown command: ${command}\n\n${usage()}`);
    return 1;
  }
  if (subcommand !== 'pack') {
    stderr.write(`Unknown studio command: ${subcommand ?? ''}\n\n${usage()}`);
    return 1;
  }
  if (rest.length > 0) {
    stderr.write(`studio pack takes no arguments\n\n${usage()}`);
    return 1;
  }

  try {
    const { pack } = await import('./pack.js');
    await pack({ root: cwd });
    return 0;
  } catch (err) {
    stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    return 1;
  }
}

/**
 * `digit-app`: apps built before the `studio` group have `"pack": "digit-app pack"`.
 * Its top-level `pack` maps to `sutton studio pack`; everything else behaves like `sutton`.
 * @param {string[]} argv arguments after the binary name
 */
export function legacyArgv(argv) {
  return argv[0] === 'pack' ? ['studio', ...argv] : argv;
}
