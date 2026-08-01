import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));

// Bundle the Worker + @digit/lib-backend into a single ESM file for publish.
export default defineConfig({
  publicDir: false,
  resolve: { preserveSymlinks: true },
  build: {
    lib: {
      entry: path.resolve(root, 'src/backend/worker.js'),
      formats: ['es'],
      fileName: () => 'worker.js',
    },
    outDir: path.resolve(root, 'backend'),
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
