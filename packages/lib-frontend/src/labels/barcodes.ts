/**
 * Barcode SVG for label print (no JS in the print document). Mirrors digit-web's
 * `labelSvgRender`, so Code 128, GS1-128, QR and GS1 Data Matrix come out the
 * same as native label print.
 */

import bwipjs from "@bwip-js/browser";

import { gs1128AiIsVariableLength } from "./gs1";

export type BarcodeKind = "code128" | "gs1-128" | "upc" | "qr" | "datamatrix";

const DEFAULT_SCALE = 3;
const DEFAULT_PADDING = 2;
const FNC1_TOKEN = "^FNC1";

/**
 * Linear bars reproduce the designer canvas: 28 module-high bars inside a
 * 10-module quiet zone, so bars land in the stamp box the way the design shows.
 */
const LINEAR_BAR_MODULES = 28;
const LINEAR_QUIET_ZONE_MODULES = 10;
const LINEAR_BAR_HEIGHT_MM = (LINEAR_BAR_MODULES * 25.4) / 72;

type BwipColor = { barcolor?: string };

function bwipColor(fill: string | undefined): BwipColor {
  const hex = fill?.match(/^#([0-9a-f]{6})$/i)?.[1];
  return hex ? { barcolor: hex } : {};
}

/** `(01)123(10)LOT` → `^FNC1011 23^FNC1…`: the plain-encoder form for GS1 data bwip rejects. */
function parenToFnc1(humanReadable: string): string | null {
  const matcher = /\((\d+)\)([^(]*)/g;
  const segments: { ai: string; value: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(humanReadable)) !== null) {
    segments.push({ ai: match[1], value: match[2] });
  }
  if (segments.length === 0) return null;
  let out = FNC1_TOKEN;
  segments.forEach((segment, index) => {
    out += segment.ai + segment.value.replace(/\^/g, "^^");
    if (index < segments.length - 1 && gs1128AiIsVariableLength(segment.ai)) out += FNC1_TOKEN;
  });
  return out;
}

/** Fill the stamp box, keeping modules square (2D codes). */
function fitSvg(svg: string): string {
  if (svg.includes('width="100%"')) return svg;
  return svg.replace("<svg ", '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" ');
}

/** Fill the stamp box exactly. Safe for 1D codes: readers only measure bar-width ratios. */
function stretchSvg(svg: string): string {
  if (svg.includes('width="100%"')) return svg;
  return svg.replace("<svg ", '<svg width="100%" height="100%" preserveAspectRatio="none" ');
}

const linearOptions = {
  scale: DEFAULT_SCALE,
  height: LINEAR_BAR_HEIGHT_MM,
  paddingwidth: LINEAR_QUIET_ZONE_MODULES,
  paddingheight: LINEAR_QUIET_ZONE_MODULES,
  includetext: false,
};

const matrixOptions = {
  scale: DEFAULT_SCALE,
  paddingwidth: DEFAULT_PADDING,
  paddingheight: DEFAULT_PADDING,
};

function gs1128Svg(value: string, color: BwipColor): string {
  try {
    return stretchSvg(bwipjs.toSVG({ bcid: "gs1-128", text: value, parse: true, ...linearOptions, ...color }));
  } catch (error) {
    // bwip validates GS1 data strictly (GTIN check digit, charset, lengths) and rejects
    // payloads native print has always printed. GS1-128 is Code 128 with FNC1 up front.
    const fnc1 = parenToFnc1(value);
    if (!fnc1) throw error;
    return stretchSvg(bwipjs.toSVG({ bcid: "code128", text: fnc1, parsefnc: true, ...linearOptions, ...color }));
  }
}

function dataMatrixSvg(value: string, color: BwipColor): string {
  try {
    return fitSvg(bwipjs.toSVG({ bcid: "gs1datamatrix", text: value, parse: true, ...matrixOptions, ...color }));
  } catch (error) {
    const fnc1 = parenToFnc1(value);
    if (!fnc1) {
      return fitSvg(bwipjs.toSVG({ bcid: "datamatrix", text: value, ...matrixOptions, ...color }));
    }
    return fitSvg(bwipjs.toSVG({ bcid: "datamatrix", text: fnc1, parsefnc: true, ...matrixOptions, ...color }));
  }
}

export function barcodeSvg({
  kind,
  value,
  fill = "#111111",
}: {
  kind: BarcodeKind;
  value: string;
  fill?: string;
}): string {
  const text = value.trim();
  if (!text) return "";
  const color = bwipColor(fill);

  if (kind === "qr") return fitSvg(bwipjs.toSVG({ bcid: "qrcode", text, ...matrixOptions, ...color }));
  if (kind === "datamatrix") return dataMatrixSvg(text, color);
  if (kind === "gs1-128") return gs1128Svg(text, color);
  if (kind === "upc" && /^\d{11,12}$/.test(text)) {
    return stretchSvg(bwipjs.toSVG({ bcid: "upca", text, ...linearOptions, ...color }));
  }
  return stretchSvg(bwipjs.toSVG({ bcid: "code128", text, ...linearOptions, ...color }));
}

export function inferBarcodeKind({
  stampType,
  barcodeFormat,
  value,
}: {
  stampType: string;
  barcodeFormat?: string;
  value: string;
}): BarcodeKind {
  const token = `${stampType} ${barcodeFormat ?? ""}`.toLowerCase();
  if (token.includes("qr")) return "qr";
  if (token.includes("datamatrix") || token.includes("data-matrix") || token.includes("data_matrix")) {
    return "datamatrix";
  }
  if (token.includes("upc")) return "upc";
  if (token.includes("gs1")) return "gs1-128";
  const digits = value.replace(/\D/g, "");
  if ((barcodeFormat ?? "").toLowerCase() === "upc-a" || (digits.length === 12 && token.includes("upc"))) {
    return "upc";
  }
  return "code128";
}
