import path from 'node:path';

/**
 * Internal Vite config: Digit loads the entry as a classic <script> (no type="module"),
 * so build IIFE → frontend/index.js (the platform entry convention). CSS is injected into
 * the JS bundle.
 */
export function frontendViteConfig({ root, plugins }) {
  return {
    root,
    publicDir: false,
    // file: linked @digit/lib-* peer-depend on react/MUI — resolve from the app.
    resolve: { preserveSymlinks: true },
    plugins,
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
