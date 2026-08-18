import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Vite `build.license` writes `.vite/license.md`. Append that text to the JS entry as a
 * block comment so Digit's iframe-loaded `index.js` carries third-party notices without a
 * separate licenses API.
 */
export function inlineBundleLicenses() {
  let outDir = '';

  return {
    name: 'digit-inline-bundle-licenses',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      if (!outDir) return;

      const licensePath = path.join(outDir, '.vite', 'license.md');
      let licenseText;
      try {
        licenseText = await fs.readFile(licensePath, 'utf8');
      } catch (err) {
        if (err && err.code === 'ENOENT') return;
        throw err;
      }

      const entryPath = path.join(outDir, 'index.js');
      // Avoid terminating the block comment early if a license body contains `*/`.
      const safe = licenseText.replace(/\*\//g, '*\\/').trimEnd();
      const block = `\n/*!\n${safe}\n*/\n`;

      await fs.appendFile(entryPath, block, 'utf8');

      // Keep frontend/backend dirs to the platform entry convention (index.js only).
      await fs.rm(path.join(outDir, '.vite'), { recursive: true, force: true });
    },
  };
}
