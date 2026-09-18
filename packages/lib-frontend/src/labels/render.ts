import type {
  LabelLayoutObject,
  LabelPrintConfig,
  LabelPrintRecord,
  LabelStampType,
  ParsedLabelLayout,
  PrintLabelArgs,
  RenderLabelPrintHtmlArgs,
} from "./types";
import { barcodeSvg, inferBarcodeKind } from "./barcodes";

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

function resolveStampText(obj: LabelLayoutObject, record: LabelPrintRecord): string {
  const bound = bindRecordValue({ record, bindingKey: obj.bindingKey });
  const rawText = asString(obj.text) ?? "";
  if (rawText.includes("{{")) return interpolateText(rawText, record);
  if (bound) {
    if (obj.includeLabel && obj.label) return `${obj.label}: ${bound}`;
    return bound;
  }
  if (rawText) return interpolateText(rawText, record);
  if (obj.includeLabel && obj.label) return obj.label;
  return "";
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

function imageSrc(obj: LabelLayoutObject, record: LabelPrintRecord): string {
  const bound = bindRecordValue({ record, bindingKey: obj.bindingKey });
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
  record,
  inlineImage,
}: {
  obj: LabelLayoutObject;
  layout: ParsedLabelLayout;
  record: LabelPrintRecord;
  inlineImage: (url: string) => Promise<string | null>;
}): Promise<string> {
  if (obj.visible === false) return "";
  const kind = stampKind(obj);
  const box = objectBox(obj);
  const fill = asString(obj.fill) ?? "#111111";
  const align = asString(obj.textAlign) ?? "left";
  const fontSize = obj.fontSize ?? 12;
  const fontFamily = asString(obj.fontFamily) ?? "Helvetica, Arial, sans-serif";
  const fontWeight = obj.fontWeight ?? "normal";
  const fontStyle = asString(obj.fontStyle) ?? "normal";

  if (kind === "barcode" || kind === "gs1" || kind === "qr" || kind === "datamatrix" || kind === "upc") {
    const value = resolveStampText(obj, record);
    if (!value) return "";
    const barcodeKind = inferBarcodeKind({
      stampType: `${obj.stampType ?? ""} ${kind}`,
      barcodeFormat: obj.barcodeFormat,
      value,
    });
    const svg = barcodeSvg({ kind: barcodeKind, value, fill });
    return `<div class="digit-label-stamp" style="${boxStyle(box, layout)}">${svg}</div>`;
  }

  if (kind === "image" || kind === "logo" || kind === "photo") {
    const src = await inlineImage(imageSrc(obj, record));
    if (!src) return "";
    return `<div class="digit-label-stamp" style="${boxStyle(box, layout)}"><img src="${escapeHtml(src)}" alt="" style="width:100%;height:100%;object-fit:contain"/></div>`;
  }

  if (kind === "bom") {
    const rows = asBomRows(record, obj);
    const cells = rows.map((row) =>
      `<tr><td>${escapeHtml(row.name)}</td><td style="text-align:right">${escapeHtml(row.qty)}</td></tr>`
    ).join("");
    return `<div class="digit-label-stamp" style="${boxStyle(box, layout, `font:${fontSize}px/1.2 ${fontFamily};color:${fill}`)}"><table style="width:100%;border-collapse:collapse;font:inherit">${cells}</table></div>`;
  }

  if (kind === "status") {
    const value = resolveStampText(obj, record);
    if (!value) return "";
    const extra = `display:flex;align-items:center;justify-content:center;border-radius:999px;background:${asString(obj.backgroundColor) ?? "#111"};color:#fff;font:${fontSize}px/1 ${fontFamily};padding:0 6px`;
    return `<div class="digit-label-stamp" style="${boxStyle(box, layout, extra)}">${escapeHtml(value)}</div>`;
  }

  if (kind === "shape") {
    const type = (obj.type ?? "").toLowerCase();
    const stroke = asString(obj.stroke) ?? fill;
    const strokeWidth = obj.strokeWidth ?? 1;
    if (type === "line") {
      return `<div class="digit-label-stamp" style="${boxStyle(box, layout, `background:${stroke};height:${Math.max(strokeWidth, 1)}px`)}"></div>`;
    }
    const radius = obj.rx ?? obj.ry ?? (type === "circle" ? 999 : 0);
    const extra = `background:${asString(obj.fill) ?? "transparent"};border:${strokeWidth}px solid ${stroke};border-radius:${radius}px`;
    return `<div class="digit-label-stamp" style="${boxStyle(box, layout, extra)}"></div>`;
  }

  const text = resolveStampText(obj, record);
  if (!text && kind !== "text") return "";
  const extra = [
    `font-size:${fontSize}px`,
    `font-family:${fontFamily}`,
    `font-weight:${fontWeight}`,
    `font-style:${fontStyle}`,
    `color:${fill}`,
    `text-align:${align}`,
    "display:flex",
    "align-items:flex-start",
    "white-space:pre-wrap",
    "overflow:hidden",
  ].join(";");
  return `<div class="digit-label-stamp" style="${boxStyle(box, layout, extra)}">${escapeHtml(text)}</div>`;
}

function printCss(layout: ParsedLabelLayout): string {
  const w = layout.widthIn;
  const h = layout.heightIn;
  return `@page{size:${w}in ${h}in;margin:0}html,body{margin:0;padding:0;background:#fff}*{box-sizing:border-box}.digit-label-page{width:${w}in;height:${h}in;position:relative;overflow:hidden;background:${layout.background};color:#111;page-break-after:always;break-after:page;-webkit-print-color-adjust:exact;print-color-adjust:exact}.digit-label-page:last-child{page-break-after:auto;break-after:auto}.digit-label-stamp{position:absolute;overflow:hidden}.digit-label-stamp svg,.digit-label-stamp img{display:block;width:100%;height:100%}`;
}

export async function renderLabelPrintHtml({
  config,
  record = {},
  copies = 1,
  inlineImage = defaultInlineImage,
}: RenderLabelPrintHtmlArgs): Promise<string> {
  const layout = parseLabelLayout(config);
  const stamps = (await Promise.all(
    layout.objects.map((obj) => stampHtml({ obj, layout, record, inlineImage })),
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
  const printHost = host ?? (typeof window !== "undefined" ? window.DigitHost : undefined);
  if (!printHost?.print) {
    throw new Error("DigitHost.print is not available. Call this from a published Digit app.");
  }
  printHost.print({
    title: labelPrintTitle({ name: title ?? renderArgs.config.name }),
    html,
  });
}
