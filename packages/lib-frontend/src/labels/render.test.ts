import assert from "node:assert/strict";
import { test } from "node:test";

import { encodeCode128Values, inferBarcodeKind, barcodeSvg } from "./barcodes";
import {
  bindRecordValue,
  labelPrintTitle,
  parseLabelLayout,
  renderLabelPrintHtml,
} from "./render";

test("encodeCode128Values checksum for ABC", () => {
  const values = encodeCode128Values("ABC");
  // Start B, A, B, C, checksum
  assert.equal(values[0], 104);
  assert.equal(values[1], 33);
  assert.equal(values[2], 34);
  assert.equal(values[3], 35);
  assert.equal(values[4], (104 + 33 + 68 + 105) % 103);
});

test("GS1-128 prefixes FNC1", () => {
  const values = encodeCode128Values("(01)12345678901231", { gs1: true });
  assert.equal(values[0], 105); // Start C for digit-heavy payload
  assert.equal(values[1], 102); // FNC1
});

test("inferBarcodeKind maps stamp types", () => {
  assert.equal(inferBarcodeKind({ stampType: "qrCode", value: "x" }), "qr");
  assert.equal(inferBarcodeKind({ stampType: "barcode", barcodeFormat: "GS1-128", value: "01" }), "gs1-128");
  assert.equal(inferBarcodeKind({ stampType: "barcode", value: "abc" }), "code128");
});

test("barcodeSvg returns inline svg", () => {
  const svg = barcodeSvg({ kind: "code128", value: "SKU-1" });
  assert.match(svg, /<svg /);
  assert.match(svg, /<rect /);
  const qr = barcodeSvg({ kind: "qr", value: "SKU-1" });
  assert.match(qr, /<svg /);
  assert.match(qr, /<path /);
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

test("labelPrintTitle matches DigitHost rules", () => {
  assert.equal(labelPrintTitle({ name: "FG ticket #12" }), "FG ticket 12");
  assert.equal(labelPrintTitle({ name: "***" }), "Label");
  assert.ok(labelPrintTitle({ name: "A".repeat(200) }).length <= 119);
});
