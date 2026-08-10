/**
 * Timecard Worker.
 *
 * D1 binding: TIMECARD_DB (see manifest.json + migrations/) - one row per shift,
 * keyed by `user_id` (Digit `currentUser.id`, resolved on the frontend via
 * useDigitApiQuery so no manifest permission is required).
 */

import { AppErrorCode } from '@digit/lib-common';
import { backendPath, createHandler, err } from '@digit/lib-backend';

import { handleShifts } from './shifts.js';

export default createHandler({
  fetch: async ({ request, env }) => {
    const path = backendPath(request);
    const { method } = request;

    const shiftsResponse = await handleShifts({ request, env, path, method });
    if (shiftsResponse) return shiftsResponse;

    return err({ code: AppErrorCode.NOT_FOUND, message: 'Not found.', status: 404 });
  },
});
