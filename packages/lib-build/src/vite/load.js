import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REQUIRED = ['vite', '@vitejs/plugin-react', 'vite-plugin-css-injected-by-js'];

/** packages/lib-build/src/vite/load.js → the root that hoists lib-build's dependencies. */
function hoistRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
}

/** Unwrap the interop default that CJS plugins arrive with. */
function pluginFactory(mod) {
  for (const candidate of [mod, mod?.default, mod?.default?.default]) {
    if (typeof candidate === 'function') return candidate;
  }
  return null;
}

/**
 * Import each module in turn. @vitejs/plugin-react is CJS and require()s vite, so a
 * parallel import can catch vite mid-load.
 */
async function importAll(toSpecifier) {
  const loaded = [];
  for (const name of REQUIRED) {
    const specifier = toSpecifier(name);
    if (!specifier) return null;
    try {
      loaded.push(await import(specifier));
    } catch (err) {
      if (err?.code === 'ERR_MODULE_NOT_FOUND') return null;
      throw err;
    }
  }
  return loaded;
}

/**
 * Load the build toolchain. Node resolves bare imports from lib-build's real path, so with
 * `file:` links the toolchain must be hoisted to an ancestor of packages/lib-build — the
 * app's own node_modules is not on that lookup path. Fall back to resolving from the app
 * root for layouts that install it there instead.
 */
export async function loadViteToolchain({ root }) {
  const fromAppRoot = createRequire(path.join(root, 'package.json'));
  const modules =
    (await importAll((name) => name)) ??
    (await importAll((name) => {
      try {
        return pathToFileURL(fromAppRoot.resolve(name)).href;
      } catch {
        return null;
      }
    }));

  if (!modules) {
    throw new Error(
      [
        `Cannot find the build toolchain (${REQUIRED.join(', ')}).`,
        '',
        `Run \`npm install\` from the workspace root: ${hoistRoot()}`,
        'Installing inside the app folder alone is not enough — @digit/lib-build is a `file:`',
        'link, so npm installs its dependencies at the workspace root instead.',
      ].join('\n'),
    );
  }

  const [vite, react, cssInjectedByJs] = modules;
  const build = vite.build ?? vite.default?.build;
  const factories = [pluginFactory(react), pluginFactory(cssInjectedByJs)];

  if (typeof build !== 'function' || factories.some((factory) => !factory)) {
    throw new Error('The installed vite / vite plugins do not expose the expected exports.');
  }

  return { build, plugins: factories.map((factory) => factory()) };
}
