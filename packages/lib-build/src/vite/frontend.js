import path from 'node:path';

import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

import { inlineBundleLicenses } from './inlineBundleLicenses.js';

/**
 * Internal Vite config: Digit loads the entry as a classic <script> (no type="module"),
 * so build IIFE → frontend/index.js (the platform entry convention). CSS is injected into
 * the JS bundle.
 */
export function frontendViteConfig({ root }) {
  return {
    root,
    publicDir: false,
    // file: linked @digit/lib-* peer-depend on react/MUI — resolve from the app.
    resolve: { preserveSymlinks: true },
    plugins: [react(), cssInjectedByJsPlugin(), inlineBundleLicenses()],
    build: {
      outDir: path.join(root, 'frontend'),
      emptyOutDir: true,
      cssCodeSplit: false,
      sourcemap: false,
      // Modern Chromium iframe hosts; conservative vs Workers' es2024.
      target: 'es2022',
      minify: 'oxc',
      cssMinify: true,
      assetsInlineLimit: 4096,
      reportCompressedSize: true,
      // Collect dependency license texts; inlined into index.js by the plugin above.
      license: true,
      // Single-file React+MUI IIFE routinely exceeds Vite’s 500 kB hint.
      chunkSizeWarningLimit: 1024,
      // IIFE classic script — no modulepreload polyfill needed.
      modulePreload: false,
      rolldownOptions: {
        input: path.join(root, 'src/frontend/main.tsx'),
        output: {
          format: 'iife',
          entryFileNames: 'index.js',
          name: 'DigitApp',
          minify: {
            compress: {
              dropConsole: true,
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
