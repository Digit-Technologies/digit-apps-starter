#!/usr/bin/env node
// `sutton`: `sutton studio pack`, `sutton --help`, `sutton --version`.
import { run } from './run.js';

process.exitCode = await run(process.argv.slice(2));
