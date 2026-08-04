import path from 'node:path';

/** Internal Vite config: bundle Worker + @digit/lib-backend into backend/worker.js (ESM). */
export function backendViteConfig({ root }) {
  return {
    root,
    publicDir: false,
    resolve: { preserveSymlinks: true },
    build: {
      lib: {
        entry: path.join(root, 'src/backend/worker.js'),
        formats: ['es'],
        fileName: () => 'worker.js',
      },
      outDir: path.join(root, 'backend'),
      emptyOutDir: true,
      sourcemap: false,
      minify: false,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  };
}
