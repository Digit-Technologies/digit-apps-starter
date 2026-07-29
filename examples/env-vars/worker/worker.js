/**
 * Cloudflare Worker for the env-vars example.
 *
 * Configure on the Digit app:
 *   env var WELCOME_MESSAGE = "Shipped from the Worker"
 *
 * Digit injects app env vars into this Worker as env bindings.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/greeting' || url.pathname.endsWith('/greeting')) {
      return Response.json({
        message: env.WELCOME_MESSAGE ?? 'WELCOME_MESSAGE is not set on this app',
        source: 'env.WELCOME_MESSAGE',
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
