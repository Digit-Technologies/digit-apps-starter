#!/usr/bin/env node
import { pack } from './pack.js';

const usage = `Usage: digit-app pack

Build frontend/ (+ backend/ when present) and write app.zip for a Digit preview or live deployment.

Local Digit runtime preview is not supported — the platform injects Workers, env/secrets, and D1.
Pack is the shared step before a remote preview or live deployment.
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
