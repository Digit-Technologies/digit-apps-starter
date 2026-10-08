import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canPrintPreview,
  initialLabelPrintState,
  labelPrintReducer,
  type LabelPrintState,
} from "./useLabelPrint";
import type { LabelPreviewDocument } from "./types";

const preview: LabelPreviewDocument = {
  html: "<p>label</p>",
  title: "Widget",
  widthIn: 4,
  heightIn: 6,
  copies: 1,
};

const ready: LabelPrintState = { ...initialLabelPrintState, preview };

test("loading clears any earlier result", () => {
  const state = labelPrintReducer({ ...ready, error: "old" }, { type: "load" });
  assert.deepEqual(state, { preview: null, error: null, loading: true, printing: false });
});

test("a loaded preview replaces the error and stops loading", () => {
  const state = labelPrintReducer(
    { ...initialLabelPrintState, loading: true, error: "old" },
    { type: "loaded", preview },
  );
  assert.deepEqual(state, { preview, error: null, loading: false, printing: false });
});

test("a failed preview shows the message and no preview", () => {
  const state = labelPrintReducer({ ...ready, loading: true }, { type: "failed", message: "boom" });
  assert.deepEqual(state, { preview: null, error: "boom", loading: false, printing: false });
});

test("a failed print keeps the preview so the user can retry", () => {
  const printing = labelPrintReducer(ready, { type: "print" });
  assert.equal(printing.printing, true);
  const failed = labelPrintReducer(printing, { type: "printFailed", message: "rejected" });
  assert.deepEqual(failed, { preview, error: "rejected", loading: false, printing: false });
  assert.equal(labelPrintReducer(printing, { type: "printed" }).printing, false);
});

test("reset returns to the empty state", () => {
  assert.deepEqual(labelPrintReducer(ready, { type: "reset" }), initialLabelPrintState);
});

test("Print is available only for a complete preview that is not already printing", () => {
  assert.equal(canPrintPreview(initialLabelPrintState), false);
  assert.equal(canPrintPreview(ready), true);
  assert.equal(canPrintPreview({ ...ready, printing: true }), false);
});
