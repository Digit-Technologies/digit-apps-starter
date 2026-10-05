/**
 * GS1 element-string builders for label barcodes. Mirrors digit-web's
 * `utils/gs1/buildGs1128ElementString`, so a studio app prints the same
 * GS1-128 / Data Matrix payloads native label print does.
 */

type DateLike = string | number | Date | null | undefined;

/** FNC1 / group separator between variable-length AIs (Code 128 char 207). */
export const GS1_128_FNC1 = String.fromCharCode(207);

const GS1128_DEFAULT_AI_CHAIN: readonly string[] = ["01", "21"];
const DATA_MATRIX_DEFAULT_AI_CHAIN: readonly string[] = ["01", "10", "21", "240"];
const DATA_MATRIX_URL_DEFAULT_AI_CHAIN: readonly string[] = ["01", "10", "21"];
const GS1128_MAX_APPLICATION_IDENTIFIERS = 5;

/** Stored net weight is always pounds; AI 310n wants kilograms. */
const NET_LB_TO_KG = 0.45359237;

export function gs1128AiIsVariableLength(ai: string): boolean {
  switch (ai) {
    case "10":
    case "21":
    case "22":
    case "30":
    case "240":
    case "241":
      return true;
    default:
      return false;
  }
}

export type BuildGs1128Input = {
  /** AI (21): the inventory label number (`scanCodeNumber`). */
  serial: string;
  gtin14?: string | null;
  containedGtin14?: string | null;
  productionDate?: DateLike;
  packagingDate?: DateLike;
  dueDate?: DateLike;
  sellByDate?: DateLike;
  expiryDate?: DateLike;
  /** Net mass in pounds (gross − tare). */
  netWeight?: number | null;
  lotNumber?: string | null;
  variableCount?: number | null;
  internalVariant?: string | null;
  secondarySerial?: string | null;
  additionalProductId?: string | null;
  customerPartNumber?: string | null;
};

export type Gs1128Segment = { ai: string; value: string };

function yyMmDd(value: DateLike): string | null {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const yy = String(date.getFullYear() % 100).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

function sanitizeVariableAlnum(value: string, maxLen: number): string {
  return value.replace(/[^\x20-\x7E]/g, "").slice(0, maxLen);
}

function trimmed(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  return value || null;
}

function encodeAi20(raw: string | null | undefined): string | null {
  const digits = String(raw ?? "").trim().replace(/\D/g, "");
  if (digits.length === 0) return null;
  if (digits.length === 1) return digits.padStart(2, "0");
  return digits.slice(0, 2);
}

function encodeWeightMantissa(ai: string, mass: number): Gs1128Segment | null {
  const n = parseInt(ai[3], 10);
  if (Number.isNaN(n) || n < 0 || n > 9) return null;
  const scaled = Math.round(mass * 10 ** n);
  return { ai, value: Math.min(999999, Math.max(0, scaled)).toString().padStart(6, "0") };
}

function encodeAi(ai: string, input: BuildGs1128Input): Gs1128Segment | null {
  if (ai === "01") {
    const value = trimmed(input.gtin14);
    return value ? { ai, value } : null;
  }
  if (ai === "02") {
    const value = trimmed(input.containedGtin14) ?? trimmed(input.gtin14);
    return value ? { ai, value } : null;
  }
  if (ai === "10") {
    const lot = input.lotNumber?.trim();
    if (!lot) return null;
    const value = sanitizeVariableAlnum(lot, 20);
    return value ? { ai, value } : null;
  }
  const dateByAi: Record<string, DateLike> = {
    "11": input.productionDate,
    "12": input.dueDate,
    "13": input.packagingDate,
    "15": input.sellByDate,
    "17": input.expiryDate,
  };
  if (ai in dateByAi) {
    const value = yyMmDd(dateByAi[ai]);
    return value ? { ai, value } : null;
  }
  if (ai === "21") {
    const value = sanitizeVariableAlnum(input.serial.trim(), 20);
    return value ? { ai, value } : null;
  }
  if (ai === "22") {
    const value = sanitizeVariableAlnum(input.secondarySerial?.trim() || input.serial.trim(), 20);
    return value ? { ai, value } : null;
  }
  if (ai === "20") {
    const value = encodeAi20(input.internalVariant);
    return value ? { ai, value } : null;
  }
  if (ai === "240") {
    const value = sanitizeVariableAlnum(input.additionalProductId?.trim() ?? "", 30);
    return value ? { ai, value } : null;
  }
  if (ai === "241") {
    const value = sanitizeVariableAlnum(input.customerPartNumber?.trim() ?? "", 30);
    return value ? { ai, value } : null;
  }
  if (ai === "30") {
    const count = input.variableCount;
    if (count == null || !Number.isFinite(count) || count < 0) return null;
    return { ai, value: String(Math.min(99999999, Math.floor(count))) };
  }
  if (/^310[0-9]$/.test(ai)) {
    const netLb = input.netWeight;
    return netLb == null || netLb <= 0 ? null : encodeWeightMantissa(ai, netLb * NET_LB_TO_KG);
  }
  if (/^320[0-9]$/.test(ai)) {
    const netLb = input.netWeight;
    return netLb == null || netLb <= 0 ? null : encodeWeightMantissa(ai, netLb);
  }
  return null;
}

function buildFromAiChain(
  chain: readonly string[],
  input: BuildGs1128Input,
): { element: string; humanReadable: string; segments: Gs1128Segment[] } {
  const segments: Gs1128Segment[] = [];
  for (const ai of chain) {
    const segment = encodeAi(ai, input);
    if (segment) segments.push(segment);
  }
  let element = "";
  segments.forEach(({ ai, value }, index) => {
    element += ai + value;
    if (index < segments.length - 1 && gs1128AiIsVariableLength(ai)) element += GS1_128_FNC1;
  });
  return {
    element,
    humanReadable: segments.map((s) => `(${s.ai})${s.value}`).join(""),
    segments,
  };
}

function digitalLinkAiIsPathKey(ai: string): boolean {
  return ai === "01" || ai === "22" || ai === "10" || ai === "21";
}

/** GS1 Digital Link URI: key AIs become path segments, the rest query params. */
function buildDigitalLinkUri(baseUrl: string | null | undefined, segments: Gs1128Segment[]): string {
  const base = (baseUrl ?? "").trim().replace(/\/+$/, "");
  if (!base || segments.length === 0) return "";
  let path = "";
  const query: string[] = [];
  for (const { ai, value } of segments) {
    if (digitalLinkAiIsPathKey(ai)) path += `/${ai}/${encodeURIComponent(value)}`;
    else query.push(`${ai}=${encodeURIComponent(value)}`);
  }
  return `${base}${path}${query.length > 0 ? `?${query.join("&")}` : ""}`;
}

/** Inventory fields the GS1 builders read. */
export type Gs1Inventory = {
  scanCodeNumber?: number | string | null;
  lotNumber?: string | null;
  createdAt?: DateLike;
  expirationDate?: DateLike;
  grossWeight?: number | null;
  tareWeight?: number | null;
  quantityInStock?: number | null;
  quantityAvailable?: number | null;
  acceptedItems?: number | null;
  item?: { gtin?: string | null; sku?: string | null } | null;
  purchaseOrderItem?: { itemVendor?: { vendorItemSku?: string | null } | null } | null;
};

export type Gs1Context = {
  serialNumber?: string | null;
  inventory?: Gs1Inventory | null;
  item?: { gtin?: string | null; sku?: string | null; vendorSku?: string | null } | null;
  job?: { lotNumber?: string | null } | null;
  dataMatrixUrlBaseUrl?: string | null;
};

export type BarcodePayload = {
  encodedValue: string;
  symbology: "code128" | "gs1_128" | "gs1_datamatrix" | "gs1_datamatrix_url";
  caption: string;
};

export type Gs1Key = "gs1128" | "dataMatrix" | "dataMatrixUrl";

/** Lot on the inventory (receiving); otherwise the job's lot (production labels). */
export function resolveLotNumber(
  inventory?: { lotNumber?: string | null } | null,
  job?: { lotNumber?: string | null } | null,
): string | null {
  return inventory?.lotNumber?.trim() || job?.lotNumber?.trim() || null;
}

function scanCodeNumberString(inventory?: Gs1Inventory | null): string | undefined {
  const n = inventory?.scanCodeNumber;
  if (n == null) return undefined;
  const text = String(n).trim();
  return text === "" ? undefined : text;
}

function resolveAiChain(key: Gs1Key, identifiers: readonly string[] | null | undefined): string[] {
  const fallback =
    key === "dataMatrix"
      ? DATA_MATRIX_DEFAULT_AI_CHAIN
      : key === "dataMatrixUrl"
        ? DATA_MATRIX_URL_DEFAULT_AI_CHAIN
        : GS1128_DEFAULT_AI_CHAIN;
  if (identifiers == null) return [...fallback];
  const list = identifiers.filter((ai): ai is string => typeof ai === "string");
  if (list.length > GS1128_MAX_APPLICATION_IDENTIFIERS) {
    throw new Error(
      `GS1-128 allows at most ${GS1128_MAX_APPLICATION_IDENTIFIERS} application identifiers; received ${list.length}.`,
    );
  }
  return list.length > 0 ? list : [...fallback];
}

export function gs1BarcodePayload(
  key: Gs1Key,
  identifiers: readonly string[] | null | undefined,
  ctx: Gs1Context,
): BarcodePayload {
  const code128 = ctx.serialNumber?.trim() || "";
  const fallback: BarcodePayload = { encodedValue: code128, symbology: "code128", caption: code128 };
  const inventory = ctx.inventory;

  const net = (inventory?.grossWeight ?? 0) - (inventory?.tareWeight ?? 0);
  const qty = inventory?.quantityInStock ?? inventory?.quantityAvailable ?? inventory?.acceptedItems ?? null;
  const gtin14 = [ctx.item?.gtin, inventory?.item?.gtin].find((g) => g != null && `${g}`.trim() !== "");
  const sku =
    ctx.item?.sku?.trim() ||
    inventory?.item?.sku?.trim() ||
    ctx.item?.vendorSku?.trim() ||
    inventory?.purchaseOrderItem?.itemVendor?.vendorItemSku?.trim() ||
    null;

  const { element, humanReadable, segments } = buildFromAiChain(resolveAiChain(key, identifiers), {
    serial: scanCodeNumberString(inventory) ?? "",
    gtin14,
    productionDate: inventory?.createdAt,
    packagingDate: inventory?.createdAt,
    expiryDate: inventory?.expirationDate,
    netWeight: net > 0 ? net : null,
    lotNumber: resolveLotNumber(inventory, ctx.job),
    variableCount: typeof qty === "number" ? qty : null,
    internalVariant: scanCodeNumberString(inventory),
    additionalProductId: sku,
    customerPartNumber:
      ctx.item?.vendorSku?.trim() || inventory?.purchaseOrderItem?.itemVendor?.vendorItemSku?.trim() || null,
  });

  if (key === "dataMatrixUrl") {
    const uri = buildDigitalLinkUri(ctx.dataMatrixUrlBaseUrl, segments);
    return uri ? { encodedValue: uri, symbology: "gs1_datamatrix_url", caption: uri } : fallback;
  }
  if (!element) return fallback;
  if (key === "dataMatrix") {
    const value = humanReadable || element;
    return { encodedValue: value, symbology: "gs1_datamatrix", caption: value };
  }
  return { encodedValue: element, symbology: "gs1_128", caption: humanReadable || element };
}

type Gs1LayoutStamp = {
  bindingKey?: string | null;
  stampType?: string | null;
  type?: string | null;
  gs1128ApplicationIdentifiers?: readonly (string | null | undefined)[] | null;
};

function layoutGs1128Chain(objects: readonly Gs1LayoutStamp[]): string[] {
  const stamp = objects.find(
    (obj) => obj.bindingKey === "gs1128" && (obj.stampType === "barcode" || obj.type === "Image"),
  );
  const ids = stamp?.gs1128ApplicationIdentifiers;
  return Array.isArray(ids) ? ids.filter((ai): ai is string => typeof ai === "string") : [];
}

/**
 * The AI chain a GS1-128 stamp prints. A non-default chain on the layout stamp
 * wins, then a configuration `options` entry with key `gs1128`, then whatever
 * the stamp has (empty falls back to the default chain).
 */
export function resolveGs1128Identifiers(
  objects: readonly Gs1LayoutStamp[],
  options?: readonly { key?: string | null; gs1128ApplicationIdentifiers?: readonly (string | null)[] | null }[] | null,
): string[] {
  const fromLayout = layoutGs1128Chain(objects);
  const layoutIsDefault =
    fromLayout.length === 0 ||
    (fromLayout.length === GS1128_DEFAULT_AI_CHAIN.length &&
      GS1128_DEFAULT_AI_CHAIN.every((ai) => fromLayout.includes(ai)));
  if (!layoutIsDefault) return fromLayout;
  const fromOptions = (options?.find((o) => o?.key === "gs1128")?.gs1128ApplicationIdentifiers ?? []).filter(
    (ai): ai is string => typeof ai === "string",
  );
  return fromOptions.length > 0 ? fromOptions : fromLayout;
}
