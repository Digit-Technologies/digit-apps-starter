import path from 'node:path';

import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

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
    plugins: [react(), cssInjectedByJsPlugin()],
    build: {
      outDir: path.join(root, 'frontend'),
      emptyOutDir: true,
      cssCodeSplit: false,
      sourcemap: false,
      rollupOptions: {
        input: path.join(root, 'src/frontend/main.tsx'),
        output: {
          format: 'iife',
          entryFileNames: 'index.js',
          name: 'DigitApp',
        },
      },
    },
  };
}
