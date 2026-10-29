import React from "react";
import assert from "node:assert/strict";
import { test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { AppErrorAlert } from "./AppErrorAlert.js";
import { isRetryable } from "./messages.js";
import type { AppError } from "./types.js";

const unavailable: AppError = {
  kind: "backend",
  code: "BACKEND_UNAVAILABLE",
  message: "fetch failed",
  status: 503,
  requestId: "req-1",
};

const badInput: AppError = {
  kind: "backend",
  code: "VALIDATION_ERROR",
  message: "title is required",
  status: 400,
  requestId: null,
};

test("AppErrorAlert shows support info and Retry for a transient error", () => {
  assert.equal(isRetryable(unavailable), true);
  const html = renderToStaticMarkup(<AppErrorAlert error={unavailable} onRetry={() => {}} />);
  assert.match(html, /role="alert"/);
  assert.match(html, /code=BACKEND_UNAVAILABLE/);
  assert.match(html, /requestId=req-1/);
  assert.match(html, />Retry</);
});

test("AppErrorAlert leaves Retry out without onRetry or for a non-transient error", () => {
  assert.doesNotMatch(renderToStaticMarkup(<AppErrorAlert error={unavailable} />), />Retry</);
  assert.equal(isRetryable(badInput), false);
  assert.doesNotMatch(
    renderToStaticMarkup(<AppErrorAlert error={badInput} onRetry={() => {}} />),
    />Retry</,
  );
});

test("AppErrorAlert accepts a custom title", () => {
  const html = renderToStaticMarkup(<AppErrorAlert error={unavailable} title="Notes did not load" />);
  assert.match(html, /Notes did not load/);
});
