/**
 * Full Featured example Worker.
 *
 * Env (Digit app settings):
 *   WELCOME_MESSAGE       — Config tab
 *   API_BASE_URL          — Secrets tab (e.g. https://httpbin.org)
 *   THIRD_PARTY_API_KEY   — Secrets tab (secret; never returned to the UI)
 *
 * D1 binding: FULL_FEATURED_DB (see manifest.json + migrations/)
 */

import { AppErrorCode, parseJsonResponse } from '@digit/lib-common';
import {
  backendPath,
  createHandler,
  digitJobs,
  err,
  ok,
  requireEnv,
} from '@digit/lib-backend';

import { noteStats, pruneNotes } from './jobs.js';
import { handleNotes } from './notes.js';

export default createHandler({
  jobs: {
    'prune-notes': pruneNotes,
    'note-stats': noteStats,
  },
  fetch: async ({ request, env }) => {
    const path = backendPath(request);
    const { method } = request;

    if (method === 'GET' && path === '/greeting') {
      return ok({
        data: { message: requireEnv({ env, key: 'WELCOME_MESSAGE' }) },
      });
    }

    if (method === 'GET' && path === '/weather') {
      const url = new URL(request.url);
      const latitude = url.searchParams.get('lat') || '40.7128';
      const longitude = url.searchParams.get('lon') || '-74.006';
      const weatherUrl =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${encodeURIComponent(latitude)}` +
        `&longitude=${encodeURIComponent(longitude)}` +
        `&current=temperature_2m,weather_code` +
        `&temperature_unit=fahrenheit`;

      const response = await fetch(weatherUrl);
      if (!response.ok) {
        return err({
          code: AppErrorCode.UPSTREAM_ERROR,
          message: `Weather upstream failed (HTTP ${response.status}).`,
          status: 502,
        });
      }
      const data = await response.json();
      const current = data?.current ?? {};
      return ok({
        data: {
          latitude: Number(latitude),
          longitude: Number(longitude),
          temperatureF: current.temperature_2m ?? null,
          weatherCode: current.weather_code ?? null,
          observedAt: current.time ?? null,
        },
      });
    }

    if (method === 'GET' && path === '/external-status') {
      const apiBase = requireEnv({ env, key: 'API_BASE_URL' });
      const apiKey = requireEnv({ env, key: 'THIRD_PARTY_API_KEY' });
      const response = await fetch(`${apiBase.replace(/\/$/, '')}/bearer`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!response.ok) {
        return err({
          code: AppErrorCode.UPSTREAM_ERROR,
          message: `Upstream request failed (HTTP ${response.status}).`,
          status: 502,
        });
      }
      const data = await response.json();
      return ok({
        data: {
          authenticated: Boolean(data?.authenticated),
          // Never return the secret — only a short prefix for the demo UI.
          tokenPrefix: apiKey.length > 0 ? `${apiKey.slice(0, 2)}…` : null,
        },
      });
    }

    if (method === 'POST' && path === '/jobs/note-stats') {
      const { runId } = await digitJobs({ env }).submit({ name: 'note-stats' });
      return ok({ data: { runId }, status: 202 });
    }

    if (method === 'GET' && path === '/jobs/runs') {
      const runs = await digitJobs({ env }).list({ limit: 20 });
      return ok({ data: { runs } });
    }

    if (method === 'GET' && path === '/jobs/schedules') {
      const schedules = await digitJobs({ env }).schedules();
      return ok({ data: { schedules } });
    }

    const notesResponse = await handleNotes({ request, env, path, method });
    if (notesResponse) return notesResponse;

    if (method === 'POST' && path === '/error/demo') {
      const body = await parseJsonResponse({ value: request.json() });
      if (!body.ok) {
        return err({ code: body.error.code, message: body.error.message, status: 400 });
      }
      if (body.value.kind === 'validation') {
        return err({
          code: AppErrorCode.VALIDATION_ERROR,
          message: 'Demo validation failure.',
          status: 400,
        });
      }
      if (body.value.kind === 'server') {
        return err({
          code: AppErrorCode.SERVER_ERROR,
          message: 'Demo server failure.',
          status: 500,
        });
      }
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'Body must include kind: "validation" | "server".',
        status: 400,
      });
    }

    return err({ code: AppErrorCode.NOT_FOUND, message: 'Not found.', status: 404 });
  },
});
