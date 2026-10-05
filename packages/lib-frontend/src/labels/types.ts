/**
 * Label print types. Native Sutton labels are designed in the label builder and stored on the API
 * as a custom label configuration (`layoutJson` plus options). This package never renders them:
 * the host renders with the same code native label print uses (`AppHost.invoke("renderLabel")`),
 * so a studio label prints exactly like a native one.
 */

import type { AppHost } from "../globals";

/** Custom label configuration from the Digit API: `layoutJson`, `options`, `labelWidth`, `labelHeight`, `labelName`. */
export type LabelPrintConfig = Record<string, unknown>;

/**
 * The records the label binds, as the API returns them: `inventory`, `item`, `org`, and for some
 * labels `job`, `purchaseOrder`, `shipment`. Optional `serialNumber`, `quantity`, `uomLabel`,
 * `defaultUom` override what the host derives from them.
 */
export type LabelPrintRecord = Record<string, unknown>;

export type RenderLabelArgs = {
  config: LabelPrintConfig;
  record?: LabelPrintRecord;
  /** Repeat the label on additional pages (1–50). */
  copies?: number;
  /**
   * Print dialog title. ASCII letters/digits plus spaces `. _ - ( )`, 1–119 chars. Defaults to the
   * serial, item name or configuration name.
   */
  title?: string;
  /** Host to render through. Defaults to `AppHost`; override in tests. */
  host?: Pick<AppHost, "invoke">;
};

/** What the host returns: pass `{ title, html }` to `AppHost.invoke("print", ...)`. */
export type RenderedLabel = {
  html: string;
  title: string;
  widthIn: number;
  heightIn: number;
  copies: number;
};

export type PrintLabelArgs = RenderLabelArgs;
