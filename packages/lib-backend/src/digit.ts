import { AppErrorCode } from '@digit/lib-common';

import { HandlerError } from './createHandler';

/** A GraphQL result from the Digit API, relayed as-is: check `errors` as well as `data`. */
export type DigitQueryResult<T = unknown> = {
  data?: T | null;
  errors?: { message: string; extensions?: { code?: string } }[];
};

/**
 * The Digit API from a backend worker, scoped to the manifest's `permissions`. Inside `fetch` it
 * acts as the user whose request it is serving; in jobs, schedules and webhooks it acts as the
 * app's creator. A preview build can only read.
 */
export type DigitApi = {
  query<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<DigitQueryResult<T>>;
};

type DigitBinding = {
  query(options: {
    query: string;
    variables?: Record<string, unknown>;
    request?: string;
  }): Promise<{ status: number; body: unknown }>;
};

const REQUEST_HANDLE_HEADER = 'X-Digit-Request-Handle';

/**
 * Built by `createHandler` and passed to every handler as `digit` — use that rather than calling
 * this, so a request handler can't accidentally act as the creator instead of its user.
 */
export function digitApi({ env, request }: { env: unknown; request?: Request }): DigitApi {
  const handle = request?.headers.get(REQUEST_HANDLE_HEADER) ?? undefined;
  return {
    async query<T = unknown>(query: string, variables?: Record<string, unknown>) {
      const binding = (env as Record<string, unknown>).__DIGIT as DigitBinding | undefined;
      if (!binding) {
        throw new HandlerError({
          code: AppErrorCode.MISSING_CONFIG,
          message:
            '__DIGIT is unavailable — it is injected into published backend apps; local dev has no Digit access.',
        });
      }

      const { status, body } = await binding.query({ query, variables, request: handle });
      if (status < 200 || status >= 300) {
        // The platform's refusals (creator removed, request expired, rate limited) carry a code;
        // surfacing it is what makes a failed job's run history say why.
        const code = (body as { error?: { code?: unknown } } | null)?.error?.code;
        throw new HandlerError({
          code: AppErrorCode.UPSTREAM_ERROR,
          message: `Digit API call failed (HTTP ${status}${typeof code === 'string' ? `: ${code}` : ''}).`,
          status: 502,
        });
      }
      return body as DigitQueryResult<T>;
    },
  };
}
