/**
 * Studio-safe label print types.
 *
 * Native Digit labels are designed in digit-web (Fabric canvas) and stored on
 * the API as `layoutJson`. This package does not ship the designer; it turns
 * that stored config plus a record into HTML for `DigitHost.print`.
 */

/** Loose configuration object from the Digit API (plus optional size fields). */
export type LabelPrintConfig = {
  id?: string;
  name?: string | null;
  /** Fabric canvas JSON (string or already-parsed object). */
  layoutJson?: unknown;
  /** Legacy field list used when `layoutJson` is missing. */
  fields?: unknown;
  labelWidthIn?: number;
  labelHeightIn?: number;
  width?: number;
  height?: number;
  widthIn?: number;
  heightIn?: number;
  [key: string]: unknown;
};

/**
 * Values bound onto stamps. Nested objects work with dotted `bindingKey`s
 * (`item.sku`). Apps typically pass the inventory/item/container payload
 * they already loaded from the Digit API.
 */
export type LabelPrintRecord = Record<string, unknown>;

export type LabelStampType =
  | "text"
  | "barcode"
  | "gs1"
  | "qr"
  | "datamatrix"
  | "upc"
  | "image"
  | "logo"
  | "photo"
  | "bom"
  | "status"
  | "shape"
  | "unknown";

export type LabelLayoutObject = {
  type?: string;
  stampType?: string;
  bindingKey?: string;
  barcodeFormat?: string;
  text?: string;
  label?: string;
  includeLabel?: boolean;
  src?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  textAlign?: string;
  originX?: string;
  originY?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  opacity?: number;
  visible?: boolean;
  rx?: number;
  ry?: number;
  objects?: LabelLayoutObject[];
  columns?: unknown;
  [key: string]: unknown;
};

export type ParsedLabelLayout = {
  widthIn: number;
  heightIn: number;
  canvasWidth: number;
  canvasHeight: number;
  background: string;
  objects: LabelLayoutObject[];
  /** True when we fell back to the pre-composer field list. */
  legacy: boolean;
};

export type RenderLabelPrintHtmlArgs = {
  config: LabelPrintConfig;
  record?: LabelPrintRecord;
  /** Repeat the label on additional pages. */
  copies?: number;
  /** Override remote image inlining (tests / custom hosts). */
  inlineImage?: (url: string) => Promise<string | null>;
};

export type PrintLabelArgs = RenderLabelPrintHtmlArgs & {
  /**
   * Print dialog title. ASCII letters/digits plus spaces `. _ - ( )`,
   * 1–119 chars. Defaults to the config name or `Label`.
   */
  title?: string;
  host?: {
    print: (options: { title: string; html: string }) => void;
  };
};
