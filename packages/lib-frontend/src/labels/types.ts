/**
 * Label print types. Native Sutton labels are designed in the label builder and stored on the API
 * as a custom label configuration. This package never renders them: the host loads the label and
 * the record by id, renders them with the same code native label print uses, shows a preview and
 * prints (`AppHost.invoke("printLabel")`). The app never receives the rendered label or the record.
 */

import type { AppHost } from "../globals";

/**
 * The kind of record a label prints. `inventory` is for production, receiving and manual
 * inventory labels; `item` is for item labels. The label's type must match.
 */
export type LabelEntityType = "inventory" | "item";

export type PrintLabelArgs = {
  /** Id of the custom label configuration (look it up through the Digit API). */
  labelId: string;
  entityType: LabelEntityType;
  /** Id of the inventory record or item to print. */
  entityId: string;
  /** Repeat the label on additional pages (1–50). */
  copies?: number;
  /** Show the host's preview before printing. Defaults to true; false opens the print dialog directly. */
  preview?: boolean;
  /** Host to print through. Defaults to `AppHost`; override in tests. */
  host?: Pick<AppHost, "invoke">;
};
