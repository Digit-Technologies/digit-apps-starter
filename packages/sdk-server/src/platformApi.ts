import { AppErrorCode } from '@heysutton/sdk';

import { HandlerError } from './createHandler.js';

/** A GraphQL result from the Sutton API, relayed as-is: check `errors` as well as `data`. */
export type GraphqlResult<T = unknown> = {
  data?: T | null;
  errors?: { message: string; extensions?: { code?: string } }[];
};

/** The Sutton API in `fetch`, acting as the requesting user within the manifest's `permissions`. */
export type PlatformApi = {
  query<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<GraphqlResult<T>>;
};

type ApiBinding = {
  query(options: {
    query: string;
    variables?: Record<string, unknown>;
    request?: string;
  }): Promise<{ status: number; body: unknown }>;
};

const REQUEST_HANDLE_HEADER = 'X-App-Request-Handle';

export function platformApi({ env, request }: { env: unknown; request: Request }): PlatformApi {
  const handle = request.headers.get(REQUEST_HANDLE_HEADER) ?? undefined;
  return {
    async query<T = unknown>(query: string, variables?: Record<string, unknown>) {
      const binding = (env as Record<string, unknown>).__API as ApiBinding | undefined;
      if (!binding) {
        throw new HandlerError({
          code: AppErrorCode.MISSING_CONFIG,
          message:
            '__API is unavailable — it is injected into published backend apps; local dev has no API access.',
        });
      }

      const { status, body } = await binding.query({ query, variables, request: handle });
      if (status < 200 || status >= 300) {
        const code = (body as { error?: { code?: unknown } } | null)?.error?.code;
        // Passed through so the frontend tells the user to re-open the app rather than retry
        if (code === 'SESSION_EXPIRED') {
          throw new HandlerError({
            code: 'SESSION_EXPIRED',
            message: 'Your session expired. Re-open the app from Sutton.',
            status: 401,
          });
        }
        throw new HandlerError({
          code: AppErrorCode.UPSTREAM_ERROR,
          message: `API call failed (HTTP ${status}${typeof code === 'string' ? `: ${code}` : ''}).`,
          status: 502,
        });
      }
      return body as GraphqlResult<T>;
    },
  };
}
