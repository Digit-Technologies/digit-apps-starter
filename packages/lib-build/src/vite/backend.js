import path from 'node:path';

import { inlineBundleLicenses } from './inlineBundleLicenses.js';

/**
 * Internal Vite config: bundle Worker + @digit/lib-backend into backend/index.js (ESM).
 *
 * Uses an application build (not `build.lib`) with `preserveEntrySignatures` so the
 * Worker default export is kept while Oxc can fully minify — lib + `es` skips
 * whitespace minify to preserve pure annotations for downstream bundlers.
 */
export function backendViteConfig({ root }) {
  return {
    root,
    publicDir: false,
    resolve: { preserveSymlinks: true },
    plugins: [inlineBundleLicenses()],
    build: {
      outDir: path.join(root, 'backend'),
      emptyOutDir: true,
      sourcemap: false,
      // workerd tracks Chrome V8; Wrangler targets es2024.
      target: 'es2024',
      minify: 'oxc',
      cssCodeSplit: false,
      reportCompressedSize: true,
      // Collect dependency license texts; inlined into index.js by the plugin above.
      license: true,
      modulePreload: false,
      rolldownOptions: {
        input: path.join(root, 'src/backend/index.js'),
        // Keep Worker entry exports — workerd imports this module; nothing in the graph does.
        preserveEntrySignatures: 'exports-only',
        // Workers runtime module — resolved by workerd at deploy, never bundled.
        external: ['cloudflare:workers'],
        output: {
          format: 'es',
          entryFileNames: 'index.js',
          minify: {
            compress: {
              // Keep console.* for Worker observability; strip debugger only.
              dropDebugger: true,
            },
          },
        },
        treeshake: {
          propertyReadSideEffects: false,
        },
      },
    },
  };
}
