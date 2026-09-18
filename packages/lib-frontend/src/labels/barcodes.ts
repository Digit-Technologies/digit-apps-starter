/**
 * Code 128 / GS1-128 / UPC-A SVG (no JS in the print document).
 * QR uses `uqr` and is rendered as inline SVG the same way.
 */

import { encode as encodeQr } from "uqr";

const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312",
  "132212", "221213", "221312", "231212", "112232", "122132", "122231", "113222",
  "123122", "123221", "223211", "221132", "221231", "213212", "223112", "312131",
  "311222", "321122", "321221", "312212", "322112", "322211", "212123", "212321",
  "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121",
  "313121", "211331", "231131", "213113", "213311", "213131", "311123", "311321",
  "331121", "312113", "312311", "332111", "314111", "221411", "431111", "111224",
  "111422", "121124", "121421", "141122", "141221", "112214", "112412", "122114",
  "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112",
  "421211", "212141", "214121", "412121", "111143", "111341", "131141", "114113",
  "114311", "411113", "411311", "113141", "114131", "311141", "411131", "211412",
  "211214", "211232", "2331112",
];

const START_B = 104;
const START_C = 105;
const CODE_B = 100;
const CODE_C = 99;
const FNC1 = 102;
const STOP = 106;

const UPC_L = [
  "0001101", "0011001", "0010011", "0111101", "0100011",
  "0110001", "0101111", "0111011", "0110111", "0001011",
];
const UPC_R = [
  "1110010", "1100110", "1101100", "1000010", "1011100",
  "1001110", "1010000", "1000100", "1001000", "1110100",
];

export type BarcodeKind = "code128" | "gs1-128" | "upc" | "qr" | "datamatrix";

function isDigitPair(text: string, i: number): boolean {
  return i + 1 < text.length && text[i] >= "0" && text[i] <= "9" &&
    text[i + 1] >= "0" && text[i + 1] <= "9";
}

function countDigitPairs(text: string, i: number): number {
  let n = 0;
  while (isDigitPair(text, i + n * 2)) n += 1;
  return n;
}

function setBCode(ch: string): number {
  const code = ch.charCodeAt(0);
  if (code < 32 || code > 127) return 0; // space
  return code - 32;
}

/** Encode text as Code 128 symbol values (no STOP). */
export function encodeCode128Values(text: string, { gs1 = false } = {}): number[] {
  const payload = text.replace(/\((\d{2,4})\)/g, "$1");
  const values: number[] = [];
  let i = 0;
  let set: "A" | "B" | "C";

  const startC = countDigitPairs(payload, 0) >= 2;
  if (startC) {
    values.push(START_C);
    set = "C";
  } else {
    values.push(START_B);
    set = "B";
  }
  if (gs1) values.push(FNC1);

  while (i < payload.length) {
    if (payload[i] === "\x1D") {
      values.push(FNC1);
      i += 1;
      continue;
    }
    const pairs = countDigitPairs(payload, i);
    if (pairs >= 2 && set !== "C") {
      values.push(CODE_C);
      set = "C";
    } else if (pairs < 1 && set === "C") {
      values.push(CODE_B);
      set = "B";
    }

    if (set === "C" && isDigitPair(payload, i)) {
      values.push(Number(payload.slice(i, i + 2)));
      i += 2;
    } else {
      if (set === "C") {
        values.push(CODE_B);
        set = "B";
      }
      values.push(setBCode(payload[i] ?? " "));
      i += 1;
    }
  }

  let checksum = values[0] ?? START_B;
  for (let w = 1; w < values.length; w += 1) {
    checksum += (values[w] ?? 0) * w;
  }
  values.push(checksum % 103);
  return values;
}

function modulesFromCode128(values: number[]): number[] {
  const modules: number[] = [];
  const pushPattern = (pattern: string) => {
    for (let i = 0; i < pattern.length; i += 1) {
      const width = Number(pattern[i]);
      const isBar = i % 2 === 0;
      for (let n = 0; n < width; n += 1) modules.push(isBar ? 1 : 0);
    }
  };
  // Quiet zone
  for (let i = 0; i < 10; i += 1) modules.push(0);
  for (const value of values) {
    pushPattern(CODE128_PATTERNS[value] ?? CODE128_PATTERNS[0]);
  }
  pushPattern(CODE128_PATTERNS[STOP]);
  for (let i = 0; i < 10; i += 1) modules.push(0);
  return modules;
}

function upcCheckDigit(digits11: string): number {
  let sum = 0;
  for (let i = 0; i < 11; i += 1) {
    const n = Number(digits11[i]);
    sum += i % 2 === 0 ? n * 3 : n;
  }
  return (10 - (sum % 10)) % 10;
}

export function encodeUpcAModules(value: string): number[] | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11 && digits.length !== 12) return null;
  const body = digits.slice(0, 11);
  const check = digits.length === 12 ? Number(digits[11]) : upcCheckDigit(body);
  if (digits.length === 12 && check !== upcCheckDigit(body)) {
    // Still encode what we were given so a stored UPC prints.
  }
  const d = (body + String(check)).split("").map(Number);
  const modules: number[] = [];
  for (let i = 0; i < 9; i += 1) modules.push(0);
  modules.push(1, 0, 1);
  for (let i = 0; i < 6; i += 1) {
    const pattern = UPC_L[d[i] ?? 0];
    for (const bit of pattern) modules.push(Number(bit));
  }
  modules.push(0, 1, 0, 1, 0);
  for (let i = 6; i < 12; i += 1) {
    const pattern = UPC_R[d[i] ?? 0];
    for (const bit of pattern) modules.push(Number(bit));
  }
  modules.push(1, 0, 1);
  for (let i = 0; i < 9; i += 1) modules.push(0);
  return modules;
}

function svgFromModules(modules: number[], { fill = "#111" } = {}): string {
  const rects: string[] = [];
  let x = 0;
  while (x < modules.length) {
    if (!modules[x]) {
      x += 1;
      continue;
    }
    let w = 0;
    while (x + w < modules.length && modules[x + w]) w += 1;
    rects.push(`<rect x="${x}" y="0" width="${w}" height="1" fill="${escapeXml(fill)}"/>`);
    x += w;
  }
  const width = modules.length || 1;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 1" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true">${rects.join("")}</svg>`;
}

function svgFromMatrix(matrix: boolean[][], { fill = "#111" } = {}): string {
  const size = matrix.length;
  const parts: string[] = [];
  for (let y = 0; y < size; y += 1) {
    const row = matrix[y] ?? [];
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x += 1;
        continue;
      }
      let w = 0;
      while (x + w < row.length && row[x + w]) w += 1;
      parts.push(`M${x},${y}h${w}v1h-${w}z`);
      x += w;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true"><path fill="${escapeXml(fill)}" d="${parts.join("")}"/></svg>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function barcodeSvg({
  kind,
  value,
  fill = "#111",
}: {
  kind: BarcodeKind;
  value: string;
  fill?: string;
}): string {
  const text = value.trim();
  if (!text) return "";

  if (kind === "qr" || kind === "datamatrix") {
    const result = encodeQr(text, { ecc: "M", border: 2 });
    return svgFromMatrix(result.data, { fill });
  }

  if (kind === "upc") {
    const modules = encodeUpcAModules(text);
    if (modules) return svgFromModules(modules, { fill });
  }

  const values = encodeCode128Values(text, { gs1: kind === "gs1-128" });
  return svgFromModules(modulesFromCode128(values), { fill });
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
