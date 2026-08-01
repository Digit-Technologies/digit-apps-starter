import { fromThrown, parseBackendResponse, unavailableClient } from '../errors/parse';

import type { BackendFetchOptions, DigitResult } from './types';

import '../globals';

export type BackendFetchArgs = BackendFetchOptions & {
  path: string;
};

/**
 * Call the app Worker through `/proxy/backend` (`DigitProxyClient.callBackend`)
 * and normalize platform / backend results.
 *
 * Used internally by `useBackendQuery` / `useBackendMutation`.
 */
export async function backendFetch<T = unknown>({
  path,
  ...options
}: BackendFetchArgs): Promise<DigitResult<T>> {
  const client = window.DigitProxyClient;
  if (!client?.callBackend) {
    return { ok: false, error: unavailableClient() };
  }
  try {
    const response = await client.callBackend(path, options);
    const parsed = await parseBackendResponse(response);
    if (!parsed.ok) return parsed;
    return { ok: true, data: parsed.data as T };
  } catch (error) {
    return { ok: false, error: fromThrown(error) };
  }
}
