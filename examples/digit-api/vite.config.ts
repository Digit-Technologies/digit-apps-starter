import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

const root = path.dirname(fileURLToPath(import.meta.url));

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
