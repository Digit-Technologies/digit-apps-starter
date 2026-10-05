import assert from "node:assert/strict";
import { test } from "node:test";

import { printLabel } from "./printLabel";

type Call = { method: string; params: Record<string, unknown> | undefined };

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

const args = { labelId: "label-1", entityType: "inventory", entityId: "inv-1" } as const;

test("printLabel sends the host every key, with null for the ones not given", async () => {
  const { host, calls } = fakeHost({ printed: true });
  assert.equal(await printLabel({ ...args, host }), true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "printLabel");
  assert.deepEqual(calls[0].params, {
    labelId: "label-1",
    entityType: "inventory",
    entityId: "inv-1",
    copies: null,
    preview: null,
  });
});

test("printLabel clamps copies and passes the preview flag", async () => {
  const { host, calls } = fakeHost({ printed: true });
  await printLabel({ ...args, copies: 500, preview: false, host });
  assert.equal(calls[0].params?.copies, 50);
  assert.equal(calls[0].params?.preview, false);
  await printLabel({ ...args, copies: 0.4, host });
  assert.equal(calls[1].params?.copies, 1);
});

test("printLabel resolves false when the user closes the preview", async () => {
  const { host } = fakeHost(null);
  assert.equal(await printLabel({ ...args, host }), false);
});

test("printLabel passes the host's rejection through", async () => {
  const host = {
    invoke: async () => {
      throw new Error("This label has no composer layoutJson.");
    },
  };
  await assert.rejects(printLabel({ ...args, host }), /no composer layoutJson/);
});
