import { AppHost } from "../host";
import type { RenderLabelArgs, RenderedLabel } from "./types";

const MAX_COPIES = 50;

/** Print titles allow ASCII letters/digits and ` . _ - ( )`, starting with a letter or digit. */
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

function isRenderedLabel(value: unknown): value is RenderedLabel {
  if (typeof value !== "object" || value === null) return false;
  const label = value as Record<string, unknown>;
  return typeof label.html === "string" && typeof label.title === "string";
}

/**
 * Renders a label to printable HTML on the host, with the code native label print uses. Rejects if
 * the host can't (the label has no composer layout, or the host predates `renderLabel`).
 */
export async function renderLabel({
  config,
  record,
  copies,
  title,
  host = AppHost,
}: RenderLabelArgs): Promise<RenderedLabel> {
  // The host requires every key, with null for "not given".
  const result = await host.invoke("renderLabel", {
    template: JSON.stringify(config),
    record: record ? JSON.stringify(record) : null,
    copies: copies ? Math.min(MAX_COPIES, Math.max(1, Math.floor(copies))) : null,
    title: title ? labelPrintTitle({ name: title }) : null,
  });
  if (!isRenderedLabel(result)) throw new Error("renderLabel returned no label.");
  return result;
}

/** Renders the label on the host, then prints it through `AppHost.invoke("print", ...)`. */
export async function printLabel(args: RenderLabelArgs): Promise<void> {
  const label = await renderLabel(args);
  await (args.host ?? AppHost).invoke("print", { title: label.title, html: label.html });
}
