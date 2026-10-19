// Logs when pack's implementation or Vite gets loaded, so tests can assert lazy loading.
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    const result = nextResolve(specifier, context);
    if (/\/src\/pack\.js$|\/node_modules\/vite\//.test(result.url)) {
      process.stderr.write(`LOADED ${result.url}\n`);
    }
    return result;
  },
});
