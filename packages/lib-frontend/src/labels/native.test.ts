import assert from "node:assert/strict";
import { test } from "node:test";

import { buildLabelBindings } from "./bindings";
import { gs1BarcodePayload, resolveGs1128Identifiers } from "./gs1";
import { renderLabelPrintHtml } from "./render";

const inventory = {
  scanCodeNumber: 891,
  scanCodeSerialNumber: "SN-891-1",
  lotNumber: "LOT-7",
  createdAt: "2026-05-20T15:00:00.000Z",
  grossWeight: 12.5,
  tareWeight: 2.5,
  quantityInStock: 40,
  receivingStatus: "ON_HOLD",
  item: { name: "Widget", sku: "WID-1", gtin: "00012345678905", defaultStockUom: { symbol: "ea" } },
};

test("GS1-128 payload follows the AI chain and keeps FNC1 only in the raw element", () => {
  const payload = gs1BarcodePayload("gs1128", ["01", "10", "21"], { serialNumber: "SN-891-1", inventory, item: inventory.item });
  assert.equal(payload.symbology, "gs1_128");
  assert.equal(payload.caption, "(01)00012345678905(10)LOT-7(21)891");
  assert.equal(payload.encodedValue, `0100012345678905${"10"}LOT-7${String.fromCharCode(207)}21891`);
});

test("Data Matrix defaults to GTIN, lot, serial and SKU", () => {
  const payload = gs1BarcodePayload("dataMatrix", undefined, { serialNumber: "x", inventory, item: inventory.item });
  assert.equal(payload.symbology, "gs1_datamatrix");
  assert.equal(payload.caption, "(01)00012345678905(10)LOT-7(21)891(240)WID-1");
});

test("a GS1-128 stamp's chain beats the default; options fill in otherwise", () => {
  const stamp = { bindingKey: "gs1128", stampType: "barcode", gs1128ApplicationIdentifiers: ["01", "10", "21"] };
  assert.deepEqual(resolveGs1128Identifiers([stamp]), ["01", "10", "21"]);
  const plain = { bindingKey: "gs1128", stampType: "barcode", gs1128ApplicationIdentifiers: ["01", "21"] };
  assert.deepEqual(resolveGs1128Identifiers([plain], [{ key: "gs1128", gs1128ApplicationIdentifiers: ["01", "17", "21"] }]), ["01", "17", "21"]);
});

test("bindings derive native keys from an inventory record with an embedded item", () => {
  const values = buildLabelBindings({ ...inventory });
  assert.equal(values.item, "Widget");
  assert.equal(values.internalSku, "WID-1");
  assert.equal(values.labelNumber, "Label #891");
  assert.equal(values.lotNumber, "LOT-7");
  assert.equal(values.quantity, "40 ea");
  assert.equal(values.netWeight, "10 lb");
  assert.equal(values.receivingStatus, "On hold");
  assert.equal(values.barCode, "SN-891-1");
  assert.equal(values.detailSerialNumber, "SN-891-1");
});

test("native-shaped layouts draw every barcode stamp and let text grow", async () => {
  const text = (bindingKey: string, extra: Record<string, unknown> = {}) => ({
    type: "Textbox", stampType: "text", bindingKey, left: 10, top: 10, width: 120, height: 20, fontSize: 14, ...extra,
  });
  const code = (bindingKey: string, extra: Record<string, unknown> = {}) => ({
    type: "Image", stampType: "barcode", bindingKey, left: 10, top: 100, width: 200, height: 80, ...extra,
  });
  const html = await renderLabelPrintHtml({
    config: {
      labelWidthIn: 4,
      labelHeightIn: 6,
      layoutJson: {
        labelWidthIn: 4,
        labelHeightIn: 6,
        objects: [
          text("labelNumber"),
          text("lotNumber"),
          code("barCode"),
          code("gs1128", { gs1128ApplicationIdentifiers: ["01", "10", "21"] }),
          code("dataMatrix"),
          code("qrCode"),
          code("dataMatrixUrl", { dataMatrixUrlBaseUrl: "https://example.com/p" }),
        ],
      },
    },
    record: { ...inventory },
  });
  assert.equal(html.match(/<svg /g)?.length, 5);
  assert.match(html, /Label #891/);
  assert.match(html, /LOT-7/);
  assert.match(html, /\.digit-label-text\{overflow:visible;height:auto!important\}/);
  assert.doesNotMatch(html, /overflow:hidden;[^"]*Label #891/);
});

test("text keeps Fabric semantics: scale stretch, high-contrast bar, field caption, whole words", async () => {
  const stamp = (extra: Record<string, unknown>) => ({
    type: "Textbox", stampType: "text", left: 10, top: 10, width: 30, height: 15, fontSize: 12, ...extra,
  });
  const html = await renderLabelPrintHtml({
    config: { layoutJson: { labelWidthIn: 4, labelHeightIn: 6, objects: [
      stamp({ bindingKey: "item", scaleX: 1.5, scaleY: 1.25, fill: "#ffffff", highContrast: true }),
      stamp({ bindingKey: "lotNumber", showFieldName: true, fieldLabel: "Lot number", top: 60 }),
      stamp({ bindingKey: "internalSku", splitByGrapheme: true, top: 110 }),
    ] } },
    record: { ...inventory },
  });
  assert.match(html, /transform:scale\(1\.5,1\.25\);transform-origin:0 0/);
  assert.match(html, /background:#000000/);
  assert.match(html, /color:#ffffff/);
  assert.match(html, /<div style="font-size:10\.000px">Lot number<\/div><div>LOT-7<\/div>/);
  assert.match(html, /overflow-wrap:normal/);
  assert.match(html, /overflow-wrap:anywhere/);
});
