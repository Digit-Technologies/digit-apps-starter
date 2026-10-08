import React from "react";
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { LabelPrintView } from "./LabelPrintPanel";
import { initialLabelPrintState } from "./useLabelPrint";
import type { LabelPreviewDocument } from "./types";

const preview: LabelPreviewDocument = {
  html: "<!DOCTYPE html><html><body>label</body></html>",
  title: "Widget",
  widthIn: 4,
  heightIn: 6,
  copies: 1,
  withheldPermissions: [],
};

const render = (state: Partial<typeof initialLabelPrintState>) =>
  renderToStaticMarkup(<LabelPrintView state={{ ...initialLabelPrintState, ...state }} onPrint={() => {}} />);

test("the panel previews the label inline in a sandboxed iframe", () => {
  const html = render({ preview });
  assert.match(html, /data-digit-label-print-panel=""/);
  assert.match(html, /<iframe\b/);
  assert.match(html, /sandbox=""/);
  assert.doesNotMatch(html, /role="dialog"/);
});

test("the Print button is enabled for a complete preview", () => {
  assert.doesNotMatch(render({ preview }), /<button[^>]*disabled/);
});

test("the Print button is disabled until there is a preview", () => {
  assert.match(render({ loading: true }), /<button[^>]*disabled/);
});

test("withheld permissions show a warning naming them and disable Print", () => {
  const html = render({ preview: { ...preview, withheldPermissions: ["READ_JOB", "READ_ITEM_CUSTOMER"] } });
  assert.match(html, /READ_JOB, READ_ITEM_CUSTOMER/);
  assert.match(html, /<button[^>]*disabled/);
});

test("an error is shown", () => {
  assert.match(render({ error: "Failed to render label" }), /Failed to render label/);
});
