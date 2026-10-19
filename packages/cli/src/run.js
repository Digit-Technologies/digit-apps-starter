import fs from 'node:fs';

// Commands are grouped by product area (`sutton studio <command>`). Each subcommand loads
// its own module (and dependencies) only when it runs, so `--help` / `--version` never
// import Vite. Add new commands, or new groups, here the same way.
const GROUPS = {
  studio: {
    summary: 'Build and package Sutton Studio custom apps',
    commands: {
      pack: {
        summary: 'Build frontend/ (+ backend/ when present) and write app.zip',
        async run(args, { cwd }) {
          if (args.length > 0) throw new UsageError('studio pack takes no arguments', 'studio');
          const { pack } = await import('./pack.js');
          await pack({ root: cwd });
        },
      },
    },
  },
};

class UsageError extends Error {
  constructor(message, group) {
    super(message);
    this.group = group;
  }
}

const isHelp = (arg) => arg === '-h' || arg === '--help' || arg === 'help';

function table(entries) {
  const width = Math.max(...entries.map(([name]) => name.length));
  return entries.map(([name, item]) => `  ${name.padEnd(width)}  ${item.summary}`).join('\n');
}

export function version() {
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  return pkg.version;
}

export function usage() {
  return `Usage: sutton <group> <command>

Groups:
${table(Object.entries(GROUPS))}

Options:
  -h, --help     Show this help
  -v, --version  Show the version

Run \`sutton <group> --help\` for that group's commands, e.g. \`sutton studio --help\`.
`;
}

export function groupUsage(name) {
  return `Usage: sutton ${name} <command>

${GROUPS[name].summary}.

Commands:
${table(Object.entries(GROUPS[name].commands))}

Options:
  -h, --help     Show this help
${
  name === 'studio'
    ? `
studio pack writes the same app.zip for a Sutton draft or a published deployment. There is
no local runtime: the platform injects Workers, env/secrets, and D1.
`
    : ''
}`;
}

/**
 * Runs the CLI and returns the exit code. `stdout` / `stderr` are injectable for tests.
 * @param {string[]} argv arguments after the binary name
 */
export async function run(
  argv,
  { cwd = process.cwd(), stdout = process.stdout, stderr = process.stderr } = {},
) {
  const [groupName, command, ...rest] = argv;

  if (isHelp(groupName)) {
    stdout.write(usage());
    return 0;
  }
  if (groupName === '-v' || groupName === '--version') {
    stdout.write(`${version()}\n`);
    return 0;
  }
  if (!groupName) {
    stderr.write(usage());
    return 1;
  }

  const group = Object.hasOwn(GROUPS, groupName) ? GROUPS[groupName] : null;
  if (!group) {
    stderr.write(`Unknown command: ${groupName}\n\n${usage()}`);
    return 1;
  }

  if (isHelp(command)) {
    stdout.write(groupUsage(groupName));
    return 0;
  }
  if (!command) {
    stderr.write(`Missing ${groupName} command\n\n${groupUsage(groupName)}`);
    return 1;
  }
  const cmd = Object.hasOwn(group.commands, command) ? group.commands[command] : null;
  if (!cmd) {
    stderr.write(`Unknown ${groupName} command: ${command}\n\n${groupUsage(groupName)}`);
    return 1;
  }

  try {
    await cmd.run(rest, { cwd });
    return 0;
  } catch (err) {
    stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    if (err instanceof UsageError) stderr.write(`\n${groupUsage(err.group)}`);
    return 1;
  }
}

/**
 * `sutton-app` / `digit-app`: apps built before the `studio` group have `"pack": "digit-app pack"`.
 * Their top-level `pack` maps to `sutton studio pack`; everything else behaves like `sutton`.
 * @param {string[]} argv arguments after the binary name
 */
export function legacyArgv(argv) {
  return argv[0] === 'pack' ? ['studio', ...argv] : argv;
}
