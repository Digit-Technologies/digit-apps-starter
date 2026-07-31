import { AppErrorCode, type AppErrorCode as AppErrorCodeType } from '@digit/app-shared';

import { err } from './respond';

/**
 * Thrown by `requireEnv` (and similar) for expected config failures.
 * Caught by `createHandler` and turned into a structured `{ ok: false, error }` Response.
 * Prefer `return err(...)` for domain errors you handle inline.
 */
export class HandlerError extends Error {
  readonly code: AppErrorCodeType;
  readonly status: number;

  constructor({
    code,
    message,
    status = 500,
  }: {
    code: AppErrorCodeType;
    message: string;
    status?: number;
  }) {
    super(message);
    this.name = 'HandlerError';
    this.code = code;
    this.status = status;
  }
}

export type HandlerFetchArgs = {
  request: Request;
  env: unknown;
  /** Cloudflare `ExecutionContext` (`waitUntil`, …) — not an application context bag. */
  ctx: unknown;
};

export type FetchHandler = (args: HandlerFetchArgs) => Response | Promise<Response>;

export type CreateHandlerArgs = {
  fetch: FetchHandler;
};

/**
 * Wrap a Worker `fetch` handler so every response is structured JSON
 * (`{ ok: true, data }` / `{ ok: false, error }`).
 *
 * - Expected config throws (`HandlerError` from `requireEnv`) → `err(...)`
 * - Anything else thrown → `SERVER_ERROR` (details are not leaked)
 * - Prefer `return err(...)` for domain errors you handle inline
 *
 * `ctx` is Cloudflare’s `ExecutionContext` (e.g. `waitUntil`) — not an app bag.
 *
 * @example Env var + success
 * import { createHandler, requireEnv, ok } from '@digit/app-backend';
 *
 * export default createHandler({
 *   fetch: async ({ env }) => {
 *     const message = requireEnv({ env, key: 'WELCOME_MESSAGE' });
 *     return ok({ data: { message } });
 *   },
 * });
 *
 * @example Route + domain failure
 * import { createHandler, err, ok, AppErrorCode } from '@digit/app-backend';
 *
 * export default createHandler({
 *   fetch: async ({ request }) => {
 *     const url = new URL(request.url);
 *     const [, resource, id] = url.pathname.replace(/^\/proxy\/backend/, '').split('/');
 *
 *     if (resource === 'notes' && request.method === 'GET' && id) {
 *       const note = await loadNote(id); // your code
 *       if (!note) {
 *         return err({
 *           code: AppErrorCode.NOT_FOUND,
 *           message: 'Note not found.',
 *           status: 404,
 *         });
 *       }
 *       return ok({ data: { note } });
 *     }
 *
 *     return err({ code: AppErrorCode.NOT_FOUND, message: 'Not found.', status: 404 });
 *   },
 * });
 *
 * @example Validate JSON body
 * import {
 *   AppErrorCode,
 *   createHandler,
 *   err,
 *   ok,
 *   parseJsonResponse,
 *   requiredString,
 * } from '@digit/app-backend';
 *
 * export default createHandler({
 *   fetch: async ({ request }) => {
 *     if (request.method !== 'POST') {
 *       return err({
 *         code: AppErrorCode.VALIDATION_ERROR,
 *         message: 'POST only.',
 *         status: 405,
 *       });
 *     }
 *
 *     const parsed = await parseJsonResponse({
 *       value: request.json(),
 *       fields: {
 *         title: (obj) => requiredString({ obj, key: 'title' }),
 *       },
 *     });
 *     if (!parsed.ok) {
 *       return err({ code: parsed.error.code, message: parsed.error.message, status: 400 });
 *     }
 *
 *     return ok({ data: { note: parsed.value }, status: 201 });
 *   },
 * });
 *
 * @example Secret + upstream fetch + waitUntil
 * import { createHandler, requireEnv, err, ok, AppErrorCode } from '@digit/app-backend';
 *
 * export default createHandler({
 *   fetch: async ({ env, ctx }) => {
 *     const apiKey = requireEnv({ env, key: 'THIRD_PARTY_API_KEY' });
 *     const response = await fetch('https://api.example.com/v1/status', {
 *       headers: { Authorization: `Bearer ${apiKey}` },
 *     });
 *
 *     if (!response.ok) {
 *       return err({
 *         code: AppErrorCode.UPSTREAM_ERROR,
 *         message: `Upstream failed (HTTP ${response.status}).`,
 *         status: 502,
 *       });
 *     }
 *
 *     const data = await response.json();
 *     // Cloudflare ExecutionContext — keep work alive after the response.
 *     ctx.waitUntil(logAnalytics({ status: response.status }));
 *     return ok({ data: { status: data.status } });
 *   },
 * });
 */
export function createHandler({ fetch: handleFetch }: CreateHandlerArgs): {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response>;
} {
  return {
    async fetch(request, env, ctx) {
      try {
        return await handleFetch({ request, env, ctx });
      } catch (error) {
        if (error instanceof HandlerError) {
          return err({
            code: error.code,
            message: error.message,
            status: error.status,
          });
        }
        console.error('Unhandled worker error', error);
        return err({
          code: AppErrorCode.SERVER_ERROR,
          message: 'Unexpected worker error.',
          status: 500,
        });
      }
    },
  };
}
