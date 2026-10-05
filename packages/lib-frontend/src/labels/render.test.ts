import assert from "node:assert/strict";
import { test } from "node:test";

import { labelPrintTitle, printLabel, renderLabel } from "./render";

type Call = { method: string; params: Record<string, unknown> | undefined };

const fakeHost = (reply: (method: string) => unknown) => {
  const calls: Call[] = [];
  return {
    calls,
    host: {
      invoke: async (method: string, params?: Record<string, unknown>) => {
        calls.push({ method, params });
        return reply(method);
      },
    },
  };
};

const rendered = { html: "<section>label</section>", title: "Widget", widthIn: 4, heightIn: 6, copies: 1 };
const config = { labelName: "Inventory", layoutJson: { objects: [] }, options: [] };

test("renderLabel sends the host every key, as JSON strings, with null for the ones not given", async () => {
  const { host, calls } = fakeHost(() => rendered);
  const label = await renderLabel({ config, host });
  assert.deepEqual(label, rendered);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "renderLabel");
  assert.deepEqual(calls[0].params, { template: JSON.stringify(config), record: null, copies: null, title: null });
});

test("renderLabel serializes the record, clamps copies and sanitizes the title", async () => {
  const { host, calls } = fakeHost(() => rendered);
  const record = { inventory: { scanCodeNumber: 891 }, item: { name: "Widget" } };
  await renderLabel({ config, record, copies: 500, title: "Étiquette #1", host });
  assert.deepEqual(calls[0].params, {
    template: JSON.stringify(config),
    record: JSON.stringify(record),
    copies: 50,
    title: "Etiquette 1",
  });
  await renderLabel({ config, copies: 0.4, host });
  assert.equal(calls[1].params?.copies, 1);
});

test("renderLabel rejects when the host replies with no label", async () => {
  const { host } = fakeHost(() => null);
  await assert.rejects(renderLabel({ config, host }), /returned no label/);
});

test("renderLabel passes the host's rejection through", async () => {
  const host = { invoke: async () => { throw new Error("This label has no composer layoutJson."); } };
  await assert.rejects(renderLabel({ config, host }), /no composer layoutJson/);
});

test("printLabel renders on the host, then prints that snapshot", async () => {
  const { host, calls } = fakeHost((method) => (method === "renderLabel" ? rendered : {}));
  await printLabel({ config, host });
  assert.deepEqual(calls.map((c) => c.method), ["renderLabel", "print"]);
  assert.deepEqual(calls[1].params, { title: "Widget", html: "<section>label</section>" });
});

test("labelPrintTitle matches AppHost print title rules", () => {
  assert.equal(labelPrintTitle({ name: "Inventory Label" }), "Inventory Label");
  assert.equal(labelPrintTitle({ name: "  ✨ " }), "Label");
  assert.equal(labelPrintTitle({ name: "#42" }), "42");
  assert.equal(labelPrintTitle({ name: "._-" }), "Label ._-");
  assert.equal(labelPrintTitle({ name: "a".repeat(200) }).length, 119);
  assert.equal(labelPrintTitle({ name: null, fallback: "Fallback" }), "Fallback");
});
