import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * After build, append Vite's third-party license report into `index.js` as a block comment.
 *
 * Why this exists:
 * - Oxc minify drops legal comments by default, and even when kept it only preserves
 *   `/*!` / `@license` banners already in source — not package LICENSE files.
 * - `build.license: true` writes notices to `.vite/license.md` only; Digit never serves
 *   that file. The platform loads `frontend/index.js` / `backend/index.js` in an iframe.
 * - Inlining into the entry keeps MIT-style attribution with the code users actually get,
 *   without a separate licenses API or UI link.
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
