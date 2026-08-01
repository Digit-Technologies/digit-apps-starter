import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

const root = path.dirname(fileURLToPath(import.meta.url));

// Digit loads entryFile as a classic <script> (no type="module"), so build IIFE → main.js.
// CSS is injected by the JS bundle — the harness does not load separate CSS assets.
export default defineConfig({
  publicDir: false,
  // @digit/lib-frontend is a "file:" dependency (npm symlinks it), and it only
  // *peer-depends* on react/@mui — preserveSymlinks makes Node module
  // resolution use the symlink's location (this app's node_modules) rather
  // than the real path (packages/lib-frontend, which has no node_modules of
  // its own), so the shared peers resolve correctly.
  resolve: { preserveSymlinks: true },
  plugins: [react(), cssInjectedByJsPlugin()],
  build: {
    outDir: 'frontend',
    emptyOutDir: true,
    cssCodeSplit: false,
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(root, 'src/frontend/main.tsx'),
      output: {
        format: 'iife',
        entryFileNames: 'main.js',
        name: 'DigitApp',
      },
    },
  },
});
