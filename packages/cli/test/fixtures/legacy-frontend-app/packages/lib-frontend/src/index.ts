// Same imports as the real pre-rename lib-frontend (src/errors/messages.ts, types.ts).
import { AppErrorCode, type ErrorResult } from '@digit/lib-common';

const MESSAGES: Record<string, string> = {
  [AppErrorCode.NOT_FOUND]: 'legacy-lib-common-resolved: not found',
};

export function backendMessage(code: ErrorResult['error']['code']): string {
  return MESSAGES[code] ?? code;
}
