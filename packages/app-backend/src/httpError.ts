import { AppErrorCode, errResult, type AppErrorCode as AppErrorCodeType } from '@digit/app-shared';

/**
 * Thrown by assert/require helpers instead of returning `Response`.
 * Catch once at the Worker entry with `toErrorResponse`.
 */
export class HttpError extends Error {
  readonly response: Response;

  constructor(response: Response) {
    super('HttpError');
    this.name = 'HttpError';
    this.response = response;
  }
}

export function throwHttpError(
  code: AppErrorCodeType,
  message: string,
  status = 400,
): never {
  throw new HttpError(Response.json(errResult(code, message), { status }));
}

/** Map any thrown value to a Worker Response (HttpError → its body; else SERVER_ERROR). */
export function toErrorResponse(error: unknown): Response {
  if (error instanceof HttpError) return error.response;
  return Response.json(
    errResult(AppErrorCode.SERVER_ERROR, 'Unexpected worker error.'),
    { status: 500 },
  );
}
