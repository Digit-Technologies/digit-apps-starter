/**
 * Label print types. Native Sutton labels are designed in the label builder and stored on the API
 * as a custom label configuration. The app names the label and the record by id. The host loads
 * both, renders them with the same code native label print uses, and either returns that HTML
 * (`mode: "preview"`) or opens the print dialog (`mode: "print"`).
 */

import type { AppHost } from "../globals";

/**
 * The kind of record a label prints. `inventory` is for production, receiving and manual
 * inventory labels; `item` is for item labels. The label's type must match.
 */
export type LabelEntityType = "inventory" | "item";

/** `preview` returns HTML for the app to show. `print` opens the host print dialog. */
export type PrintLabelMode = "preview" | "print";

export type PrintLabelArgs = {
  /** Id of the custom label configuration (look it up through the Digit API). */
  labelId: string;
  entityType: LabelEntityType;
  /** Id of the inventory record or item to print. */
  entityId: string;
  /** Repeat the label on additional pages (1–50). */
  copies?: number;
  /**
   * `preview` renders the label and returns HTML. Nothing prints.
   * `print` opens the browser print dialog on the host. Call it only after the user confirms a preview.
   */
  mode: PrintLabelMode;
  /** Host to print through. Defaults to `AppHost`; override in tests. */
  host?: Pick<AppHost, "invoke">;
};

/**
 * What `mode: "preview"` returns. `html` is a self-contained, script-free document (inline CSS,
 * `data:` images). Show it in a sandboxed iframe. The record itself stays on the host.
 */
export type LabelPreviewDocument = {
  html: string;
  title: string;
  widthIn: number;
  heightIn: number;
  copies: number;
};
