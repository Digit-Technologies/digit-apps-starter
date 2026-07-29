/**
 * Cloudflare Worker for the secrets-third-party example.
 *
 * Configure on the Digit app:
 *   env var  API_BASE_URL         = https://httpbin.org
 *   secret   THIRD_PARTY_API_KEY  = <any demo value>
 *
 * The Worker uses the secret server-side. It never returns the secret to the frontend.
 * httpbin echoes the Authorization header shape (not a real third-party product API).
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isStatus =
      url.pathname === '/external-status' || url.pathname.endsWith('/external-status');

    if (!isStatus) {
      return new Response('Not found', { status: 404 });
    }

    const apiBase = env.API_BASE_URL;
    const apiKey = env.THIRD_PARTY_API_KEY;

    if (!apiBase || !apiKey) {
      return Response.json(
        {
          ok: false,
          error:
            'Set API_BASE_URL (env) and THIRD_PARTY_API_KEY (secret) on the Digit app, then republish.',
        },
        { status: 500 },
      );
    }

    const upstream = await fetch(`${apiBase.replace(/\/$/, '')}/bearer`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const body = await upstream.json();
    return Response.json({
      ok: upstream.ok,
      // Demonstrate authenticated upstream access without leaking the secret.
      authenticated: Boolean(body?.authenticated),
      tokenPrefix: typeof apiKey === 'string' ? `${apiKey.slice(0, 2)}…` : null,
    });
  },
};
