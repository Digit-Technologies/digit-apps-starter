import assert from "node:assert/strict";
import { test } from "node:test";

import { inferBarcodeKind, barcodeSvg } from "./barcodes";
import {
  bindRecordValue,
  labelPrintTitle,
  parseLabelLayout,
  printLabel,
  renderLabelPrintHtml,
} from "./render";

test("inferBarcodeKind maps stamp types", () => {
  assert.equal(inferBarcodeKind({ stampType: "qrCode", value: "x" }), "qr");
  assert.equal(inferBarcodeKind({ stampType: "barcode", barcodeFormat: "GS1-128", value: "01" }), "gs1-128");
  assert.equal(inferBarcodeKind({ stampType: "barcode", value: "abc" }), "code128");
});

test("barcodeSvg returns inline svg for every symbology", () => {
  for (const [kind, value] of [
    ["code128", "SKU-1"],
    ["gs1-128", "(01)00012345678905(21)891"],
    ["qr", "SKU-1"],
    ["datamatrix", "(01)00012345678905(10)LOT1(21)891"],
    ["upc", "036000291452"],
  ] as const) {
    const svg = barcodeSvg({ kind, value });
    assert.match(svg, /<svg /, kind);
    assert.match(svg, /<path /, kind);
  }
  assert.equal(barcodeSvg({ kind: "code128", value: "  " }), "");
});

test("bindRecordValue walks dotted paths and item fallbacks", () => {
  const record = { item: { sku: "ABC-1" }, lotNumber: "L9" };
  assert.equal(bindRecordValue({ record, bindingKey: "item.sku" }), "ABC-1");
  assert.equal(bindRecordValue({ record, bindingKey: "sku" }), "ABC-1");
  assert.equal(bindRecordValue({ record, bindingKey: "lotNumber" }), "L9");
});

test("parseLabelLayout reads composer layoutJson", () => {
  const layout = parseLabelLayout({
    layoutJson: JSON.stringify({
      labelWidthIn: 3,
      labelHeightIn: 2,
      width: 900,
      height: 600,
      objects: [
        {
          type: "textbox",
          stampType: "text",
          bindingKey: "item.sku",
          left: 10,
          top: 12,
          width: 200,
          height: 24,
          fontSize: 14,
        },
      ],
    }),
  });
  assert.equal(layout.widthIn, 3);
  assert.equal(layout.heightIn, 2);
  assert.equal(layout.legacy, false);
  assert.equal(layout.objects[0]?.bindingKey, "item.sku");
});

test("legacy fields stack when layoutJson is missing", () => {
  const layout = parseLabelLayout({
    fields: [
      { key: "sku", label: "SKU", visible: true, fontSize: 12, barcode: true },
    ],
  });
  assert.equal(layout.legacy, true);
  assert.equal(layout.objects.length, 2);
  assert.equal(layout.objects[1]?.stampType, "barcode");
});

test("renderLabelPrintHtml binds values and sizes the page", async () => {
  const html = await renderLabelPrintHtml({
    config: {
      name: "FG ticket",
      layoutJson: {
        labelWidthIn: 4,
        labelHeightIn: 2,
        objects: [
          {
            type: "textbox",
            stampType: "text",
            bindingKey: "item.sku",
            left: 20,
            top: 20,
            width: 200,
            height: 30,
            fontSize: 16,
          },
          {
            type: "image",
            stampType: "barcode",
            bindingKey: "item.sku",
            left: 20,
            top: 60,
            width: 240,
            height: 48,
          },
        ],
      },
    },
    record: { item: { sku: "WIDGET-9" } },
    copies: 2,
  });
  assert.match(html, /@page\{size:4in 2in/);
  assert.match(html, /WIDGET-9/);
  assert.equal(html.match(/<section class="digit-label-page">/g)?.length, 2);
  assert.match(html, /<svg /);
  assert.doesNotMatch(html, /<script/i);
});

test("labelPrintTitle matches AppHost print title rules", () => {
  assert.equal(labelPrintTitle({ name: "FG ticket #12" }), "FG ticket 12");
  assert.equal(labelPrintTitle({ name: "***" }), "Label");
  assert.ok(labelPrintTitle({ name: "A".repeat(200) }).length <= 119);
});

test("printLabel sends the rendered snapshot through host.invoke('print')", async () => {
  const calls: Array<{ method: string; params: unknown }> = [];
  await printLabel({
    title: "Inventory Label",
    config: {
      layoutJson: {
        labelWidthIn: 4,
        labelHeightIn: 2,
        objects: [
          { type: "textbox", stampType: "text", bindingKey: "item.sku", left: 0, top: 0, width: 100, height: 20, fontSize: 12 },
        ],
      },
    },
    record: { item: { sku: "WIDGET-9" } },
    host: {
      invoke: async (method, params) => {
        calls.push({ method, params });
        return null;
      },
    },
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "print");
  const params = calls[0].params as { title: string; html: string };
  assert.equal(params.title, "Inventory Label");
  assert.match(params.html, /WIDGET-9/);
});
