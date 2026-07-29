import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

const root = path.dirname(fileURLToPath(import.meta.url));

// Digit loads entryFile as a classic <script> (no type="module"), so build IIFE → main.js.
// CSS is injected by the JS bundle — the harness does not load separate CSS assets.
export default defineConfig({
  publicDir: 'public',
  plugins: [cssInjectedByJsPlugin()],
  build: {
    outDir: 'frontend',
    emptyOutDir: true,
    cssCodeSplit: false,
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(root, 'src/main.ts'),
      output: {
        format: 'iife',
        entryFileNames: 'main.js',
        name: 'DigitApp',
      },
    },
  },
});
