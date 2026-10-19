#!/usr/bin/env node
// `sutton-app` alias for already-built apps: `sutton-app pack` runs `sutton studio pack`.
import { legacyArgv, run } from './run.js';

process.exitCode = await run(legacyArgv(process.argv.slice(2)));
