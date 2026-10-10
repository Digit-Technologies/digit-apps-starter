import assert from "node:assert/strict";
import { mock, test } from "node:test";

import {
  canPrintPreview,
  initialLabelPrintState,
  labelPrintReducer,
  loadLabelPreview,
  type LabelPrintAction,
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

test("switching records twice within a second drops the superseded preview before the host", async () => {
  mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const flush = () => new Promise<void>((resolve) => setImmediate(resolve));
  const invoked: unknown[] = [];
  const host = {
    invoke: async (_method: string, params?: Record<string, unknown>) => {
      invoked.push(params?.entityId);
      return { ...preview, title: String(params?.entityId) };
    },
  };
  const actions: LabelPrintAction[] = [];
  const dispatch = (action: LabelPrintAction) => actions.push(action);
  const open = (entityId: string) =>
    loadLabelPreview({ labelId: "label-1", entityType: "inventory", entityId, host }, dispatch);

  try {
    const cancelFirst = open("inv-0");
    await flush();
    assert.deepEqual(invoked, ["inv-0"]);

    mock.timers.tick(100);
    cancelFirst();
    const cancelSecond = open("inv-1");
    await flush();

    mock.timers.tick(100);
    cancelSecond();
    open("inv-2");
    await flush();
    assert.deepEqual(invoked, ["inv-0"]);

    mock.timers.tick(799);
    await flush();
    assert.deepEqual(invoked, ["inv-0"], "still inside the host's one-second window");

    mock.timers.tick(1);
    await flush();
    assert.deepEqual(invoked, ["inv-0", "inv-2"], "the superseded inv-1 never reaches the host");
    assert.deepEqual(
      actions.map((action) => (action.type === "loaded" ? action.preview.title : action.type)),
      ["load", "inv-0", "load", "load", "inv-2"],
    );
  } finally {
    mock.timers.reset();
  }
});
