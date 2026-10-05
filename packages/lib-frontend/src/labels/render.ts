import type {
  LabelLayoutObject,
  LabelPrintConfig,
  LabelPrintRecord,
  LabelStampType,
  ParsedLabelLayout,
  PrintLabelArgs,
  RenderLabelPrintHtmlArgs,
} from "./types";
import { AppHost } from "../host";
import { barcodeSvg, inferBarcodeKind, type BarcodeKind } from "./barcodes";
import { buildLabelBindings, normalizeLabelRecord } from "./bindings";
import { gs1BarcodePayload, resolveGs1128Identifiers, type Gs1Context, type Gs1Inventory } from "./gs1";

/** Native prints the field-name line at this size (document field label). */
const FIELD_LABEL_FONT_SIZE = 10;
const DEFAULT_WIDTH_IN = 4;
const DEFAULT_HEIGHT_IN = 2;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return undefined;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseJsonValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return undefined;
  }
}

function asLayoutObjects(value: unknown): LabelLayoutObject[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry) => isRecord(entry)) as LabelLayoutObject[];
}

function pickObjects(layout: Record<string, unknown>): LabelLayoutObject[] {
  const direct = asLayoutObjects(layout.objects);
  if (direct.length) return direct;
  if (isRecord(layout.canvas)) {
    const nested = asLayoutObjects(layout.canvas.objects);
    if (nested.length) return nested;
  }
  if (isRecord(layout.layout)) {
    const nested = asLayoutObjects(layout.layout.objects);
    if (nested.length) return nested;
  }
  return [];
}

function looksLikeInches(value: number | undefined): value is number {
  return value !== undefined && value > 0 && value <= 24;
}

function flattenGroup(
  obj: LabelLayoutObject,
  offsetLeft: number,
  offsetTop: number,
): LabelLayoutObject[] {
  const children = asLayoutObjects(obj.objects);
  if (!children.length) return [{
    ...obj,
    left: (obj.left ?? 0) + offsetLeft,
    top: (obj.top ?? 0) + offsetTop,
  }];
  const groupLeft = (obj.left ?? 0) + offsetLeft;
  const groupTop = (obj.top ?? 0) + offsetTop;
  return children.flatMap((child) => flattenGroup(child, groupLeft, groupTop));
}

function legacyLayoutFromFields(config: LabelPrintConfig): ParsedLabelLayout | null {
  const fields = Array.isArray(config.fields) ? config.fields : [];
  if (!fields.length) return null;
  const objects: LabelLayoutObject[] = [];
  let y = 8;
  for (const field of fields) {
    if (!isRecord(field)) continue;
    const visible = field.visible !== false && field.show !== false;
    if (!visible) continue;
    const key = asString(field.bindingKey) ?? asString(field.key) ?? asString(field.name) ?? "";
    const label = asString(field.label) ?? asString(field.name) ?? key;
    const fontSize = asNumber(field.fontSize) ?? 12;
    const height = Math.max(fontSize + 4, 16);
    objects.push({
      type: "textbox",
      stampType: "text",
      bindingKey: key,
      label,
      includeLabel: true,
      left: 8,
      top: y,
      width: 280,
      height,
      fontSize,
      fill: "#111",
    });
    y += height + 4;
    if (field.barcode === true || field.showBarcode === true) {
      objects.push({
        type: "image",
        stampType: "barcode",
        bindingKey: key,
        left: 8,
        top: y,
        width: 220,
        height: 40,
      });
      y += 48;
    }
    if (field.qr === true || field.showQr === true || field.showQR === true) {
      objects.push({
        type: "image",
        stampType: "qr",
        bindingKey: key,
        left: 8,
        top: y,
        width: 72,
        height: 72,
      });
      y += 80;
    }
  }
  if (!objects.length) return null;
  const widthIn = looksLikeInches(asNumber(config.labelWidthIn) ?? asNumber(config.widthIn) ?? asNumber(config.width))
    ? (asNumber(config.labelWidthIn) ?? asNumber(config.widthIn) ?? asNumber(config.width) ?? DEFAULT_WIDTH_IN)
    : DEFAULT_WIDTH_IN;
  const heightIn = looksLikeInches(asNumber(config.labelHeightIn) ?? asNumber(config.heightIn) ?? asNumber(config.height))
    ? (asNumber(config.labelHeightIn) ?? asNumber(config.heightIn) ?? asNumber(config.height) ?? DEFAULT_HEIGHT_IN)
    : Math.max(DEFAULT_HEIGHT_IN, y / 96);
  return {
    widthIn,
    heightIn,
    canvasWidth: 96 * widthIn,
    canvasHeight: 96 * heightIn,
    background: "#ffffff",
    objects,
    legacy: true,
  };
}

export function parseLabelLayout(config: LabelPrintConfig): ParsedLabelLayout {
  const parsed = parseJsonValue(config.layoutJson);
  const layout = isRecord(parsed) ? parsed : isRecord(config.layoutJson) ? config.layoutJson : {};
  const rawObjects = pickObjects(layout);
  const objects = rawObjects.flatMap((obj) => flattenGroup(obj, 0, 0));

  if (!objects.length) {
    const legacy = legacyLayoutFromFields(config);
    if (legacy) return legacy;
  }

  const layoutWidthIn = asNumber(layout.labelWidthIn) ?? asNumber(layout.widthIn);
  const layoutHeightIn = asNumber(layout.labelHeightIn) ?? asNumber(layout.heightIn);
  const configWidthIn = asNumber(config.labelWidthIn) ?? asNumber(config.widthIn);
  const configHeightIn = asNumber(config.labelHeightIn) ?? asNumber(config.heightIn);
  const rawWidth = asNumber(layout.width) ?? asNumber(config.width);
  const rawHeight = asNumber(layout.height) ?? asNumber(config.height);

  const widthIn = looksLikeInches(layoutWidthIn)
    ? layoutWidthIn
    : looksLikeInches(configWidthIn)
      ? configWidthIn
      : looksLikeInches(rawWidth)
        ? rawWidth
        : DEFAULT_WIDTH_IN;
  const heightIn = looksLikeInches(layoutHeightIn)
    ? layoutHeightIn
    : looksLikeInches(configHeightIn)
      ? configHeightIn
      : looksLikeInches(rawHeight)
        ? rawHeight
        : DEFAULT_HEIGHT_IN;

  const canvasWidth = rawWidth && rawWidth > 24
    ? rawWidth
    : Math.max(
      96 * widthIn,
      ...objects.map((obj) => (obj.left ?? 0) + (obj.width ?? 0) * (obj.scaleX ?? 1)),
      1,
    );
  const canvasHeight = rawHeight && rawHeight > 24
    ? rawHeight
    : Math.max(
      96 * heightIn,
      ...objects.map((obj) => (obj.top ?? 0) + (obj.height ?? 0) * (obj.scaleY ?? 1)),
      1,
    );

  const background = asString(layout.background) ?? "#ffffff";

  return {
    widthIn,
    heightIn,
    canvasWidth,
    canvasHeight,
    background,
    objects,
    legacy: objects.length === 0,
  };
}

function getPath(record: unknown, path: string): unknown {
  if (!path) return undefined;
  if (isRecord(record) && path in record) return record[path];
  const parts = path.split(".");
  let current: unknown = record;
  for (const part of parts) {
    if (!isRecord(current) && !Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function lastSegment(path: string): string {
  const parts = path.split(".");
  return parts[parts.length - 1] ?? path;
}

function formatBoundValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) {
    return value.map((entry) => formatBoundValue(entry)).filter(Boolean).join(", ");
  }
  if (isRecord(value)) {
    return asString(value.name) ?? asString(value.sku) ?? asString(value.id) ?? "";
  }
  return "";
}

export function bindRecordValue({
  record,
  bindingKey,
}: {
  record: LabelPrintRecord;
  bindingKey?: string;
}): string {
  if (!bindingKey) return "";
  const direct = formatBoundValue(getPath(record, bindingKey));
  if (direct) return direct;
  const nestedItem = formatBoundValue(getPath(record, `item.${bindingKey}`));
  if (nestedItem) return nestedItem;
  const nestedInv = formatBoundValue(getPath(record, `inventory.${bindingKey}`));
  if (nestedInv) return nestedInv;
  const leaf = formatBoundValue(getPath(record, lastSegment(bindingKey)));
  return leaf;
}

function interpolateText(template: string, record: LabelPrintRecord): string {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, raw: string) => {
    return bindRecordValue({ record, bindingKey: raw.trim() });
  });
}

function stampKind(obj: LabelLayoutObject): LabelStampType {
  // A `customImage` stamp saved as a Textbox prints its text; only a real Image draws a picture.
  if (obj.stampType === "customImage" && /textbox/i.test(obj.type ?? "")) return "text";
  if (obj.stampType === "boundImage" || obj.stampType === "customImage") return "image";
  const token = `${obj.stampType ?? ""} ${obj.type ?? ""} ${obj.barcodeFormat ?? ""}`.toLowerCase();
  if (token.includes("gs1")) return "gs1";
  if (token.includes("datamatrix") || token.includes("data-matrix")) return "datamatrix";
  if (token.includes("upc")) return "upc";
  if (token.includes("qr")) return "qr";
  if (token.includes("barcode") || token.includes("code128") || token.includes("code-128")) return "barcode";
  if (token.includes("logo")) return "logo";
  if (token.includes("photo") || token.includes("itemimage") || token.includes("item-image")) return "photo";
  if (token.includes("image") && (obj.src || obj.stampType)) return "image";
  if (token.includes("bom") || token.includes("table")) return "bom";
  if (token.includes("status") || token.includes("pill")) return "status";
  if (token.includes("rect") || token.includes("line") || token.includes("circle") || token.includes("triangle")) {
    return "shape";
  }
  if (token.includes("text") || token.includes("i-text") || token.includes("textbox")) return "text";
  if (obj.bindingKey) return "text";
  return "unknown";
}

type Box = { left: number; top: number; width: number; height: number; angle: number; opacity: number };

function objectBox(obj: LabelLayoutObject): Box {
  const scaleX = obj.scaleX ?? 1;
  const scaleY = obj.scaleY ?? 1;
  const width = Math.max((obj.width ?? 0) * scaleX, 1);
  const height = Math.max((obj.height ?? 0) * scaleY, 1);
  let left = obj.left ?? 0;
  let top = obj.top ?? 0;
  const originX = (obj.originX ?? "left").toLowerCase();
  const originY = (obj.originY ?? "top").toLowerCase();
  if (originX === "center") left -= width / 2;
  if (originX === "right") left -= width;
  if (originY === "center") top -= height / 2;
  if (originY === "bottom") top -= height;
  return {
    left,
    top,
    width,
    height,
    angle: obj.angle ?? 0,
    opacity: obj.opacity ?? 1,
  };
}

function boxStyle(box: Box, layout: ParsedLabelLayout, extra?: string): string {
  const left = (box.left / layout.canvasWidth) * 100;
  const top = (box.top / layout.canvasHeight) * 100;
  const width = (box.width / layout.canvasWidth) * 100;
  const height = (box.height / layout.canvasHeight) * 100;
  const parts = [
    `left:${left.toFixed(4)}%`,
    `top:${top.toFixed(4)}%`,
    `width:${width.toFixed(4)}%`,
    `height:${height.toFixed(4)}%`,
    `opacity:${box.opacity}`,
  ];
  if (box.angle) parts.push(`transform:rotate(${box.angle}deg)`, "transform-origin:center center");
  if (extra) parts.push(extra);
  return parts.join(";");
}

type StampContext = {
  record: LabelPrintRecord;
  /** Native binding-key values derived from the record. */
  bindings: Record<string, string>;
  gs1: Gs1Context;
  gs1128ApplicationIdentifiers: string[];
  /** Page px per canvas px, so type and strokes scale with the stamp boxes. */
  pxScale: number;
};

/** Stamps sharing a key carry a suffix (`item-2`); the key is the part before it. */
const bindingRoot = (bindingKey: string): string => bindingKey.split("-")[0] ?? bindingKey;

function bindingValue(ctx: StampContext, bindingKey?: string): string {
  if (!bindingKey) return "";
  const derived = ctx.bindings[bindingKey] || ctx.bindings[bindingRoot(bindingKey)];
  if (derived) return derived;
  return bindRecordValue({ record: ctx.record, bindingKey });
}

function resolveStampText(obj: LabelLayoutObject, ctx: StampContext): string {
  const bound = bindingValue(ctx, obj.bindingKey);
  const rawText = asString(obj.text) ?? "";
  if (rawText.includes("{{")) return interpolateText(rawText, ctx.record);
  if (bound) {
    if (obj.includeLabel && obj.label) return `${obj.label}: ${bound}`;
    return bound;
  }
  if (rawText) return interpolateText(rawText, ctx.record);
  if (obj.includeLabel && obj.label) return obj.label;
  return "";
}

type CodeStamp = { value: string; kind: BarcodeKind };

/** The payload and symbology native print draws for a barcode stamp, by binding key. */
function codeStamp(obj: LabelLayoutObject, ctx: StampContext, fallbackKind: BarcodeKind): CodeStamp | null {
  const key = bindingRoot(obj.bindingKey ?? "");
  const serial = ctx.gs1.serialNumber?.trim() ?? "";
  const stampChain = (obj.dataMatrixApplicationIdentifiers ?? obj.gs1128ApplicationIdentifiers) as string[] | undefined;

  if (key === "barCode") return serial ? { value: serial, kind: "code128" } : null;
  if (key === "qrCode") return serial ? { value: serial, kind: "qr" } : null;
  if (key === "gs1128") {
    const payload = gs1BarcodePayload("gs1128", ctx.gs1128ApplicationIdentifiers, ctx.gs1);
    if (!payload.encodedValue) return null;
    return payload.symbology === "gs1_128"
      ? { value: payload.caption, kind: "gs1-128" }
      : { value: payload.encodedValue, kind: "code128" };
  }
  if (key === "dataMatrix") {
    const payload = gs1BarcodePayload("dataMatrix", stampChain, ctx.gs1);
    return payload.symbology === "gs1_datamatrix" && payload.encodedValue.trim()
      ? { value: payload.encodedValue, kind: "datamatrix" }
      : null;
  }
  if (key === "dataMatrixUrl") {
    const base = typeof obj.dataMatrixUrlBaseUrl === "string" ? obj.dataMatrixUrlBaseUrl : "";
    const payload = gs1BarcodePayload("dataMatrixUrl", stampChain, { ...ctx.gs1, dataMatrixUrlBaseUrl: base });
    return payload.symbology === "gs1_datamatrix_url" && payload.encodedValue.trim()
      ? { value: payload.encodedValue, kind: "qr" }
      : null;
  }

  const value = resolveStampText(obj, ctx);
  return value ? { value, kind: fallbackKind } : null;
}

function asBomRows(record: LabelPrintRecord, obj: LabelLayoutObject): Array<{ name: string; qty: string }> {
  const fromObj = obj.columns ?? obj.rows ?? obj.items;
  const source = Array.isArray(fromObj)
    ? fromObj
    : getPath(record, obj.bindingKey ?? "billOfMaterials")
      ?? getPath(record, "bom")
      ?? getPath(record, "components")
      ?? getPath(record, "item.billOfMaterials");
  if (!Array.isArray(source)) return [];
  return source.map((row) => {
    if (!isRecord(row)) return { name: formatBoundValue(row), qty: "" };
    return {
      name: asString(row.name) ?? asString(row.sku) ?? asString(row.itemName) ?? "",
      qty: asString(row.quantity) ?? asString(row.qty) ?? "",
    };
  }).filter((row) => row.name);
}

function imageSrc(obj: LabelLayoutObject, ctx: StampContext): string {
  const { record } = ctx;
  if (obj.stampType === "customImage") {
    return asString(obj.imageUrl) ?? asString(obj.src) ?? "";
  }
  const bound = bindingValue(ctx, obj.bindingKey);
  if (bound.startsWith("data:") || bound.startsWith("http")) return bound;
  const src = asString(obj.src) ?? "";
  if (src) return src;
  const photo = formatBoundValue(getPath(record, "item.imageUrl") ?? getPath(record, "item.photoUrl") ?? getPath(record, "logoUrl") ?? getPath(record, "company.logoUrl"));
  return photo;
}

async function defaultInlineImage(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  if (typeof fetch !== "function") return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    const mime = response.headers.get("content-type") || "image/png";
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return `data:${mime};base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}

async function stampHtml({
  obj,
  layout,
  ctx,
  inlineImage,
}: {
  obj: LabelLayoutObject;
  layout: ParsedLabelLayout;
  ctx: StampContext;
  inlineImage: (url: string) => Promise<string | null>;
}): Promise<string> {
  if (obj.visible === false) return "";
  const kind = stampKind(obj);
  const box = objectBox(obj);
  const fill = asString(obj.fill) ?? "#111111";
  const align = asString(obj.textAlign) ?? "left";
  const { record } = ctx;
  const fontSize = (obj.fontSize ?? 12) * ctx.pxScale;
  const fontFamily = asString(obj.fontFamily) ?? "Helvetica, Arial, sans-serif";
  const fontWeight = obj.fontWeight ?? "normal";
  const fontStyle = asString(obj.fontStyle) ?? "normal";

  if (kind === "barcode" || kind === "gs1" || kind === "qr" || kind === "datamatrix" || kind === "upc") {
    const fallbackKind = inferBarcodeKind({
      stampType: `${obj.stampType ?? ""} ${kind}`,
      barcodeFormat: obj.barcodeFormat,
      value: "",
    });
    const code = codeStamp(obj, ctx, fallbackKind);
    if (!code) return "";
    const kindForValue = code.kind === fallbackKind
      ? inferBarcodeKind({ stampType: `${obj.stampType ?? ""} ${kind}`, barcodeFormat: obj.barcodeFormat, value: code.value })
      : code.kind;
    const svg = barcodeSvg({ kind: kindForValue, value: code.value, fill });
    if (!svg) return "";
    return `<div class="digit-label-stamp" style="${boxStyle(box, layout)}">${svg}</div>`;
  }

  if (kind === "image" || kind === "logo" || kind === "photo") {
    const src = await inlineImage(imageSrc(obj, ctx));
    if (!src) return "";
    return `<div class="digit-label-stamp" style="${boxStyle(box, layout)}"><img src="${escapeHtml(src)}" alt="" style="width:100%;height:100%;object-fit:contain"/></div>`;
  }

  if (kind === "bom") {
    const rows = asBomRows(record, obj);
    const cells = rows.map((row) =>
      `<tr><td>${escapeHtml(row.name)}</td><td style="text-align:right">${escapeHtml(row.qty)}</td></tr>`
    ).join("");
    return `<div class="digit-label-stamp" style="${boxStyle(box, layout, `font:${fontSize.toFixed(3)}px/1.2 ${fontFamily};color:${fill}`)}"><table style="width:100%;border-collapse:collapse;font:inherit">${cells}</table></div>`;
  }

  if (kind === "status") {
    const value = resolveStampText(obj, ctx);
    if (!value) return "";
    const extra = `display:flex;align-items:center;justify-content:center;border-radius:999px;background:${asString(obj.backgroundColor) ?? "#111"};color:#fff;font:${fontSize.toFixed(3)}px/1 ${fontFamily};padding:0 ${(6 * ctx.pxScale).toFixed(3)}px`;
    return `<div class="digit-label-stamp" style="${boxStyle(box, layout, extra)}">${escapeHtml(value)}</div>`;
  }

  if (kind === "shape") {
    const type = (obj.type ?? "").toLowerCase();
    const stroke = asString(obj.stroke) ?? fill;
    const strokeWidth = (obj.strokeWidth ?? 1) * ctx.pxScale;
    if (type === "line") {
      return `<div class="digit-label-stamp" style="${boxStyle(box, layout, `background:${stroke};height:${Math.max(strokeWidth, 1)}px`)}"></div>`;
    }
    const radius = (obj.rx ?? obj.ry ?? (type === "circle" ? 999 : 0)) * ctx.pxScale;
    const extra = `background:${asString(obj.fill) ?? "transparent"};border:${strokeWidth}px solid ${stroke};border-radius:${radius}px`;
    return `<div class="digit-label-stamp" style="${boxStyle(box, layout, extra)}"></div>`;
  }

  const text = resolveStampText(obj, ctx);
  if (!text && kind !== "text") return "";

  // Fabric textboxes keep their natural width and are stretched by scaleX/scaleY.
  const scaleX = obj.scaleX ?? 1;
  const scaleY = obj.scaleY ?? 1;
  const natural: Box = { ...box, width: Math.max(obj.width ?? 0, 1), height: Math.max(obj.height ?? 0, 1), angle: 0 };
  const highContrast = obj.highContrast === true;
  const background = asString(obj.backgroundColor) || (highContrast ? "#000000" : "");
  const textColor = highContrast ? "#ffffff" : fill;
  const transform = [box.angle ? `rotate(${box.angle}deg)` : "", scaleX !== 1 || scaleY !== 1 ? `scale(${scaleX},${scaleY})` : ""]
    .filter(Boolean)
    .join(" ");
  const decoration = [obj.underline ? "underline" : "", obj.linethrough ? "line-through" : "", obj.overline ? "overline" : ""]
    .filter(Boolean)
    .join(" ");
  const extra = [
    `font-size:${fontSize.toFixed(3)}px`,
    `line-height:${asNumber(obj.lineHeight) ?? 1.16}`,
    `font-family:${fontFamily}`,
    `font-weight:${fontWeight}`,
    `font-style:${fontStyle}`,
    `color:${textColor}`,
    `text-align:${align}`,
    "white-space:pre-wrap",
    // Fabric only splits inside a word when the stamp asks for it (`splitByGrapheme`).
    `overflow-wrap:${obj.splitByGrapheme === true ? "anywhere" : "normal"}`,
    transform ? `transform:${transform};transform-origin:0 0` : "",
    background ? `background:${background}` : "",
    // Fabric `padding` grows the painted box outward without moving the text.
    highContrast ? `box-shadow:0 0 0 ${(6 * ctx.pxScale).toFixed(3)}px ${background}` : "",
    decoration ? `text-decoration:${decoration}` : "",
    asNumber(obj.charSpacing) ? `letter-spacing:${((asNumber(obj.charSpacing) ?? 0) / 1000).toFixed(4)}em` : "",
  ].filter(Boolean).join(";");

  // "Show field name" prints the field label as a small first line above the value.
  const fieldLabel = asString(obj.fieldLabel) ?? asString(obj.fieldName) ?? "";
  const bound = bindingValue(ctx, obj.bindingKey);
  const captioned = obj.showFieldName === true && fieldLabel && bound;
  const inner = captioned
    ? `<div style="font-size:${(FIELD_LABEL_FONT_SIZE * ctx.pxScale).toFixed(3)}px">${escapeHtml(fieldLabel)}</div><div>${escapeHtml(bound)}</div>`
    : escapeHtml(text);
  return `<div class="digit-label-stamp digit-label-text" style="${boxStyle(natural, layout, extra)}">${inner}</div>`;
}

function printCss(layout: ParsedLabelLayout): string {
  const w = layout.widthIn;
  const h = layout.heightIn;
  return `@page{size:${w}in ${h}in;margin:0}html,body{margin:0;padding:0;background:#fff}*{box-sizing:border-box}.digit-label-page{width:${w}in;height:${h}in;position:relative;overflow:hidden;background:${layout.background};color:#111;page-break-after:always;break-after:page;-webkit-print-color-adjust:exact;print-color-adjust:exact}.digit-label-page:last-child{page-break-after:auto;break-after:auto}.digit-label-stamp{position:absolute;overflow:hidden}.digit-label-text{overflow:visible;height:auto!important}.digit-label-stamp svg,.digit-label-stamp img{display:block;width:100%;height:100%}`;
}

export async function renderLabelPrintHtml({
  config,
  record = {},
  copies = 1,
  inlineImage = defaultInlineImage,
}: RenderLabelPrintHtmlArgs): Promise<string> {
  const layout = parseLabelLayout(config);
  const gs1128ApplicationIdentifiers = resolveGs1128Identifiers(
    layout.objects,
    Array.isArray(config.options) ? (config.options as Parameters<typeof resolveGs1128Identifiers>[1]) : null,
  );
  const normalized = normalizeLabelRecord(record);
  const ctx: StampContext = {
    record,
    bindings: buildLabelBindings(record, { gs1128ApplicationIdentifiers }),
    gs1: {
      serialNumber: normalized.serialNumber,
      inventory: normalized.inventory as Gs1Inventory,
      item: normalized.item as Gs1Context["item"],
      job: normalized.job as Gs1Context["job"],
    },
    gs1128ApplicationIdentifiers,
    pxScale: (layout.widthIn * 96) / layout.canvasWidth,
  };
  const stamps = (await Promise.all(
    layout.objects.map((obj) => stampHtml({ obj, layout, ctx, inlineImage })),
  )).join("");
  const count = Math.max(1, Math.min(50, Math.floor(copies) || 1));
  const pages = Array.from({ length: count }, () =>
    `<section class="digit-label-page">${stamps}</section>`
  ).join("");
  return `<style>${printCss(layout)}</style>${pages}`;
}

export function labelPrintTitle({
  name,
  fallback = "Label",
}: {
  name?: string | null;
  fallback?: string;
}): string {
  const raw = (name ?? fallback).normalize("NFKD").replace(/[^\x20-\x7E]/g, "");
  const cleaned = raw.replace(/[^A-Za-z0-9 ._()-]/g, " ").replace(/\s+/g, " ").trim();
  const withStart = /^[A-Za-z0-9]/.test(cleaned) ? cleaned : `Label ${cleaned}`.trim();
  return withStart.slice(0, 119) || "Label";
}

export async function printLabel({
  title,
  host,
  ...renderArgs
}: PrintLabelArgs): Promise<void> {
  const html = await renderLabelPrintHtml(renderArgs);
  await (host ?? AppHost).invoke("print", {
    title: labelPrintTitle({ name: title ?? renderArgs.config.name }),
    html,
  });
}
