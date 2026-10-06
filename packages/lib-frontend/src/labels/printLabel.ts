import { AppHost } from "../host";
import type { LabelPreviewDocument, PrintLabelArgs } from "./types";

const MAX_COPIES = 50;
/** Host `printLabel` is capped at one call per second. Closer calls are rejected. */
const MIN_INTERVAL_MS = 1000;

const lastInvokeAt = new WeakMap<object, number>();
const invokeTail = new WeakMap<object, Promise<void>>();

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * The host stamps the call when it arrives and rejects a second one inside a second, including a
 * print that follows a fast preview. Wait here so confirming the preview does not trip that limit.
 * Keyed by the host object so tests that pass their own host are not coupled to each other.
 */
const pacePrintLabel = async <T>(host: object, run: () => Promise<T>): Promise<T> => {
  const previous = invokeTail.get(host) ?? Promise.resolve();
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  invokeTail.set(
    host,
    previous.then(() => gate),
  );
  await previous;
  try {
    const last = lastInvokeAt.get(host);
    if (last !== undefined) {
      const elapsed = Date.now() - last;
      if (elapsed < MIN_INTERVAL_MS) {
        await delay(Math.min(MIN_INTERVAL_MS, Math.max(0, MIN_INTERVAL_MS - elapsed)));
      }
    }
    lastInvokeAt.set(host, Date.now());
    return await run();
  } finally {
    release();
  }
};

const clampCopies = (copies: number | undefined): number | null => {
  if (typeof copies !== "number" || !Number.isFinite(copies) || copies <= 0) return null;
  return Math.min(MAX_COPIES, Math.max(1, Math.floor(copies)));
};

const isPreviewDocument = (value: unknown): value is LabelPreviewDocument => {
  if (typeof value !== "object" || value === null) return false;
  const label = value as Record<string, unknown>;
  return (
    typeof label.html === "string" &&
    typeof label.title === "string" &&
    typeof label.widthIn === "number" &&
    typeof label.heightIn === "number" &&
    typeof label.copies === "number"
  );
};

const isPrinted = (value: unknown): value is { printed: true } =>
  typeof value === "object" &&
  value !== null &&
  (value as { printed?: unknown }).printed === true;

/**
 * Asks the host to render a label for a record, by id only.
 *
 * `mode: "preview"` resolves with `{ html, title, widthIn, heightIn, copies }` and prints nothing.
 * Show `html` in a sandboxed iframe. `mode: "print"` opens the browser print dialog on the host and
 * resolves `{ printed: true }`. Call it only after the user confirms that preview.
 *
 * Rejects if the host can't (the label has no composer layout, doesn't match the record type, can't
 * be loaded, the document is too large, or the host predates `printLabel`). A non-null result is not
 * treated as success — preview must be the document, and print must be `{ printed: true }`.
 */
export async function printLabel(
  args: PrintLabelArgs & { mode: "preview" },
): Promise<LabelPreviewDocument>;
export async function printLabel(
  args: PrintLabelArgs & { mode: "print" },
): Promise<{ printed: true }>;
export async function printLabel(
  args: PrintLabelArgs,
): Promise<LabelPreviewDocument | { printed: true }> {
  const { labelId, entityType, entityId, copies, mode, host = AppHost } = args;
  // The host requires every key, with null for "not given". `mode` is required.
  const result = await pacePrintLabel(host, () =>
    host.invoke("printLabel", {
      labelId,
      entityType,
      entityId,
      copies: clampCopies(copies),
      mode,
    }),
  );

  if (mode === "preview") {
    if (!isPreviewDocument(result)) {
      throw new Error("printLabel preview returned no label.");
    }
    return {
      html: result.html,
      title: result.title,
      widthIn: result.widthIn,
      heightIn: result.heightIn,
      copies: result.copies,
    };
  }

  if (!isPrinted(result)) {
    throw new Error("printLabel did not print.");
  }
  return { printed: true };
}
