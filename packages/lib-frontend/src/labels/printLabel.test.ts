import assert from "node:assert/strict";
import { mock, test } from "node:test";

import { printLabel } from "./printLabel";
import type { LabelPreviewDocument } from "./types";

type Call = { method: string; params: Record<string, unknown> | undefined };

const preview: LabelPreviewDocument = {
  html: "<!DOCTYPE html><html><body>label</body></html>",
  title: "Widget",
  widthIn: 4,
  heightIn: 6,
  copies: 2,
  withheldPermissions: [],
};

const fakeHost = (reply: unknown) => {
  const calls: Call[] = [];
  return {
    calls,
    host: {
      invoke: async (method: string, params?: Record<string, unknown>) => {
        calls.push({ method, params });
        return reply;
      },
    },
  };
};

const args = { labelId: "label-1", entityType: "inventory" as const, entityId: "inv-1" };

test("printLabel preview sends ids and mode, and returns only the document", async () => {
  const { host, calls } = fakeHost({ ...preview, record: { secret: true } });
  const label = await printLabel({ ...args, mode: "preview", host });
  assert.deepEqual(label, preview);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "printLabel");
  assert.deepEqual(calls[0].params, {
    labelId: "label-1",
    entityType: "inventory",
    entityId: "inv-1",
    copies: null,
    mode: "preview",
  });
  assert.equal(Object.hasOwn(calls[0].params ?? {}, "preview"), false);
});

test("printLabel clamps copies into the host's 1–50 range", async () => {
  const high = fakeHost(preview);
  await printLabel({ ...args, copies: 500, mode: "preview", host: high.host });
  assert.equal(high.calls[0].params?.copies, 50);

  const low = fakeHost(preview);
  await printLabel({ ...args, copies: 0.4, mode: "preview", host: low.host });
  assert.equal(low.calls[0].params?.copies, 1);
});

test("printLabel print sends the same ids and resolves only { printed: true }", async () => {
  const { host, calls } = fakeHost({ printed: true, html: "should not leak" });
  assert.deepEqual(await printLabel({ ...args, copies: 2, mode: "print", host }), {
    printed: true,
  });
  assert.deepEqual(calls[0].params, {
    labelId: "label-1",
    entityType: "inventory",
    entityId: "inv-1",
    copies: 2,
    mode: "print",
  });
});

test("printLabel rejects a preview that is not the document", async () => {
  const { host } = fakeHost({ printed: true });
  await assert.rejects(printLabel({ ...args, mode: "preview", host }), /returned no label/);
});

test("printLabel rejects a print result that is not { printed: true }", async () => {
  for (const reply of [null, { html: preview.html }, { printed: false }, {}]) {
    const { host } = fakeHost(reply);
    await assert.rejects(printLabel({ ...args, mode: "print", host }), /did not print/);
  }
});

test("printLabel passes the host's rejection through", async () => {
  const host = {
    invoke: async () => {
      throw new Error("This label has no composer layoutJson.");
    },
  };
  await assert.rejects(
    printLabel({ ...args, mode: "preview", host }),
    /no composer layoutJson/,
  );
});

test("printLabel previews, then prints only on a later call, at most once a second", async () => {
  mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const calls: Call[] = [];
  const host = {
    invoke: async (method: string, params?: Record<string, unknown>) => {
      calls.push({ method, params });
      return params?.mode === "print" ? { printed: true } : preview;
    },
  };

  try {
    const label = await printLabel({ ...args, copies: 2, mode: "preview", host });
    assert.deepEqual(label, preview);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].params?.mode, "preview");

    let printed = false;
    const pending = printLabel({ ...args, copies: 2, mode: "print", host }).then((result) => {
      printed = true;
      return result;
    });
    await Promise.resolve();
    assert.equal(printed, false);
    assert.equal(calls.length, 1);

    mock.timers.tick(999);
    await Promise.resolve();
    assert.equal(calls.length, 1);

    mock.timers.tick(1);
    assert.deepEqual(await pending, { printed: true });
    assert.equal(calls.length, 2);
    assert.equal(calls[1].params?.mode, "print");
    assert.deepEqual(
      { ...calls[0].params, mode: undefined },
      { ...calls[1].params, mode: undefined },
    );
  } finally {
    mock.timers.reset();
  }
});

test("printLabel preview reports the permissions the host left data off for", async () => {
  const { host } = fakeHost({ ...preview, withheldPermissions: ["READ_JOB", "READ_ITEM_CUSTOMER"] });
  const result = await printLabel({ ...args, mode: "preview", host });
  assert.deepEqual(result.withheldPermissions, ["READ_JOB", "READ_ITEM_CUSTOMER"]);
});

test("printLabel preview reports none from a host that predates the field", async () => {
  const { withheldPermissions: _omitted, ...withoutField } = preview;
  const { host } = fakeHost(withoutField);
  const result = await printLabel({ ...args, mode: "preview", host });
  assert.deepEqual(result.withheldPermissions, []);
});
