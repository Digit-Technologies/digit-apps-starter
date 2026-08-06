import fs from 'node:fs/promises';
import path from 'node:path';

import { backendViteConfig } from './vite/backend.js';
import { loadViteToolchain } from './vite/load.js';

export async function backendEntryExists({ root }) {
  try {
    await fs.access(path.join(root, 'src/backend/index.js'));
    return true;
  } catch {
    return false;
  }
}

export async function buildBackend({ root }) {
  if (!(await backendEntryExists({ root }))) return false;

  const { build } = await loadViteToolchain({ root });

  await build({
    configFile: false,
    ...backendViteConfig({ root }),
  });

  const migrationsSrc = path.join(root, 'src/backend/migrations');
  const migrationsDest = path.join(root, 'backend/migrations');
  try {
    const entries = await fs.readdir(migrationsSrc);
    const sqlFiles = entries.filter((name) => name.endsWith('.sql'));
    if (sqlFiles.length > 0) {
      await fs.mkdir(migrationsDest, { recursive: true });
      for (const name of sqlFiles) {
        await fs.copyFile(path.join(migrationsSrc, name), path.join(migrationsDest, name));
      }
    }
  } catch (err) {
    if (err && err.code !== 'ENOENT') throw err;
  }

  return true;
}
