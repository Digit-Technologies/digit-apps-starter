import { AppHost } from "../host";
import type { PrintLabelArgs } from "./types";

const MAX_COPIES = 50;

/**
 * Asks the host to print a label for a record. The host loads both by id, shows a preview and
 * prints when the user confirms. Resolves true once printing starts, false if the user closed the
 * preview. Rejects if the host can't (the label has no composer layout, doesn't match the record
 * type, can't be loaded, or the host predates `printLabel`).
 */
export async function printLabel({
  labelId,
  entityType,
  entityId,
  copies,
  preview,
  host = AppHost,
}: PrintLabelArgs): Promise<boolean> {
  // The host requires every key, with null for "not given".
  const result = await host.invoke("printLabel", {
    labelId,
    entityType,
    entityId,
    copies: copies ? Math.min(MAX_COPIES, Math.max(1, Math.floor(copies))) : null,
    preview: preview ?? null,
  });
  return result !== null;
}
