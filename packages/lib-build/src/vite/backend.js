import path from 'node:path';

/** Internal Vite config: bundle Worker + @digit/lib-backend into backend/index.js (ESM). */
export function backendViteConfig({ root }) {
  return {
    root,
    publicDir: false,
    resolve: { preserveSymlinks: true },
    build: {
      lib: {
        entry: path.join(root, 'src/backend/index.js'),
        formats: ['es'],
        fileName: () => 'index.js',
      },
      outDir: path.join(root, 'backend'),
      emptyOutDir: true,
      sourcemap: false,
      minify: false,
      rollupOptions: {
        // Workers runtime module — resolved by workerd at deploy, never bundled.
        external: ['cloudflare:workers'],
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  };
}
