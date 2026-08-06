import fs from 'node:fs/promises';
import path from 'node:path';

import { frontendViteConfig } from './vite/frontend.js';
import { loadViteToolchain } from './vite/load.js';

export async function buildFrontend({ root }) {
  const entry = path.join(root, 'src/frontend/main.tsx');
  const manifest = path.join(root, 'manifest.json');

  await fs.access(entry);
  await fs.access(manifest);

  const { build, plugins } = await loadViteToolchain({ root });

  await build({
    configFile: false,
    ...frontendViteConfig({ root, plugins }),
  });
}
