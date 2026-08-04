#!/usr/bin/env node
import { pack } from './pack.js';

const usage = `Usage: digit-app pack

Build frontend/ (+ backend/ when present) and write app.zip for Digit publish.

Local Digit preview (dev/preview) is not supported yet — pack + publish is the path.
`;

async function main() {
  const [, , command, ...rest] = process.argv;

  if (!command || command === '-h' || command === '--help') {
    process.stdout.write(usage);
    process.exit(command ? 0 : 1);
  }

  if (command !== 'pack') {
    console.error(`Unknown command: ${command}`);
    console.error(usage);
    process.exit(1);
  }

  if (rest.length > 0) {
    console.error('digit-app pack takes no arguments');
    process.exit(1);
  }

  try {
    await pack({ root: process.cwd() });
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
