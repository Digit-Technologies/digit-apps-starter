import fs from 'node:fs/promises';
import path from 'node:path';

import { build } from 'vite';

import { frontendViteConfig } from './vite/frontend.js';

export async function buildFrontend({ root }) {
  const entry = path.join(root, 'src/frontend/main.tsx');
  const manifest = path.join(root, 'manifest.json');

  await fs.access(entry);
  await fs.access(manifest);

  await build({
    configFile: false,
    ...frontendViteConfig({ root }),
  });

  await fs.copyFile(manifest, path.join(root, 'frontend', 'manifest.json'));
}
