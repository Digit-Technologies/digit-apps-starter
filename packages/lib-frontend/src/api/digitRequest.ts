import { fromThrown, parseProxyBody, unavailableClient } from '../errors/parse';

import type { SuttonResult } from './types';

import '../globals';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export type DigitRequestArgs = {
  query: string;
  variables?: Record<string, unknown>;
};

/**
 * Call Sutton GraphQL through the harness (`DigitProxyClient.callProxy`) and
 * normalize platform / GraphQL errors.
 *
 * Used internally by `useSuttonApiQuery` / `useSuttonApiMutation`.
 */
export async function digitRequest<T = unknown>({
  query,
  variables,
}: DigitRequestArgs): Promise<SuttonResult<T>> {
  const client = window.DigitProxyClient;
  if (!client?.callProxy) {
    return { ok: false, error: unavailableClient() };
  }
  try {
    const body = await client.callProxy({ query, variables });
    const parsed = parseProxyBody(body);
    if (!parsed.ok) return parsed;
    // Unwrap the GraphQL envelope so callers type against the operation's `data` shape.
    if (isRecord(parsed.data) && 'data' in parsed.data) {
      return { ok: true, data: parsed.data.data as T };
    }
    return { ok: true, data: parsed.data as T };
  } catch (error) {
    return { ok: false, error: fromThrown(error) };
  }
}
