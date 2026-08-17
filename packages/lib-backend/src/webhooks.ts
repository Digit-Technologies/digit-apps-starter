// Only the platform holds the dispatch binding that can call `triggerWebhook`, so invocations
// are platform-originated by construction — but the SENDER is an untrusted third party.
// Always verify the provider's signature over `body` before acting on a webhook.

/** Argument of the platform's `triggerWebhook(invocation)` RPC call, plus the Worker env/ctx. */
export type WebhookArgs = {
  /** The manifest-declared path segment this arrived on (e.g. "woocommerce"). */
  path: string;
  method: string;
  /** Raw query string without the leading `?` (may carry provider verification tokens). */
  query: string;
  /** Lower-cased request headers — signatures usually live here. */
  headers: Record<string, string>;
  /** The exact bytes the provider sent — verify signatures over these, never a re-parse. */
  body: Uint8Array;
  env: unknown;
  ctx: unknown;
};

/** Returned to the provider: statuses drive their retry behaviour (non-2xx is usually retried). */
export type WebhookResponse = {
  status: number;
  headers?: Record<string, string>;
  body?: Uint8Array | string;
};

export type WebhookHandler = (args: WebhookArgs) => WebhookResponse | Promise<WebhookResponse>;

export type WebhookHandlers = Record<string, WebhookHandler>;

/** Platform invocation shape (everything in WebhookArgs except env/ctx). */
export type WebhookInvocation = Omit<WebhookArgs, 'env' | 'ctx'>;

/** Body of the entrypoint's `triggerWebhook` — an unregistered path answers 404 to the provider. */
export async function runWebhookHandler(options: {
  invocation: WebhookInvocation;
  env: unknown;
  ctx: unknown;
  webhooks: WebhookHandlers;
}): Promise<WebhookResponse> {
  const { invocation, env, ctx, webhooks } = options;
  const path = typeof invocation?.path === 'string' ? invocation.path : '';
  const handler = webhooks[path];
  if (!handler) {
    return {
      status: 404,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: `no handler for webhook path "${path}"` }),
    };
  }
  return handler({
    path,
    method: typeof invocation.method === 'string' ? invocation.method : 'POST',
    query: typeof invocation.query === 'string' ? invocation.query : '',
    headers: invocation.headers ?? {},
    body: invocation.body instanceof Uint8Array ? invocation.body : new Uint8Array(0),
    env,
    ctx,
  });
}

const textEncoder = new TextEncoder();

function decodeSignature(signature: string, encoding: 'hex' | 'base64'): Uint8Array | null {
  try {
    if (encoding === 'base64') {
      const raw = atob(signature);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      return bytes;
    }
    if (signature.length % 2 !== 0 || /[^0-9a-fA-F]/.test(signature)) return null;
    const bytes = new Uint8Array(signature.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(signature.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  } catch {
    return null;
  }
}

/**
 * Timing-safe HMAC check over the raw webhook bytes. Covers the common provider schemes
 * directly — WooCommerce (`base64`, SHA-256), GitHub (`hex`, strip the `sha256=` prefix
 * first). Schemes that sign more than the body (e.g. Stripe's `timestamp.payload`) are
 * composed on top by building `body` yourself.
 *
 * @example WooCommerce
 * const valid = await verifyWebhookSignature({
 *   secret: requireEnv({ env, key: 'WC_WEBHOOK_SECRET' }),
 *   body,
 *   signature: headers['x-wc-webhook-signature'] ?? '',
 *   encoding: 'base64',
 * });
 * if (!valid) return { status: 401 };
 */
export async function verifyWebhookSignature({
  secret,
  body,
  signature,
  algorithm = 'SHA-256',
  encoding = 'hex',
}: {
  secret: string;
  body: Uint8Array | string;
  signature: string;
  algorithm?: 'SHA-1' | 'SHA-256' | 'SHA-512';
  encoding?: 'hex' | 'base64';
}): Promise<boolean> {
  if (!secret || !signature) return false;
  const signatureBytes = decodeSignature(signature.trim(), encoding);
  if (!signatureBytes) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: algorithm },
    false,
    ['verify'],
  );
  const bodyBytes = typeof body === 'string' ? textEncoder.encode(body) : body;
  // crypto.subtle.verify is the timing-safe primitive — never compare digest strings.
  return crypto.subtle.verify('HMAC', key, signatureBytes as BufferSource, bodyBytes as BufferSource);
}
