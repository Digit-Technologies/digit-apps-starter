#!/usr/bin/env node
// Deprecated `digit-app` alias, kept so older "pack": "digit-app pack" scripts keep working.
// `digit-app pack` runs `sutton studio pack`.
import { legacyArgv, run } from './run.js';

process.stderr.write('digit-app is deprecated; use `sutton studio pack` instead.\n');
process.exitCode = await run(legacyArgv(process.argv.slice(2)));
