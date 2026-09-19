/** Display settings pushed host → frame by digit-web. */
export type DigitHostSettings = {
  theme?: "light" | "dark";
  language?: string;
};

/** Options for `DigitHost.download` — the only way an app can save a file to disk. */
export type DigitHostDownloadOptions = {
  /** Letters, digits, spaces, dots, hyphens, underscores or parentheses; extension optional. */
  filename: string;
  contentType:
    | "text/csv"
    | "application/json"
    | "text/plain"
    | "application/pdf"
    | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  /** File contents, 10MB max. */
  data: string | ArrayBuffer | Uint8Array;
};

/** Options for `DigitHost.print`. The host sanitizes and prints this HTML snapshot. */
export type DigitHostPrintOptions = {
  /** ASCII letters/digits, spaces, dots, hyphens, underscores or parentheses; 119 chars max. */
  title: string;
  /** Self-contained printable HTML, 10MB max after inlining styles and assets. */
  html: string;
};

/**
 * Barcode types `DigitHost.scan` can request. Group aliases (`any`, `gs1_codes`)
 * are not allowed — they would make the host try every decoder.
 */
export type DigitHostScanFormat =
  | "aztec"
  | "code_128"
  | "code_39"
  | "code_93"
  | "codabar"
  | "data_matrix"
  | "ean_13"
  | "ean_8"
  | "itf"
  | "pdf417"
  | "qr_code"
  | "upc_a"
  | "upc_e";

/** Options for `DigitHost.scan`. The host owns the camera; the iframe gets decoded text. */
export type DigitHostScanOptions = {
  /**
   * Optional scan context only (e.g. "Scan PO barcode"). 1–199 characters:
   * letters, digits, spaces, and `. _ ( ) , : / -`, not starting with a symbol.
   * Consent UI names the app from Digit, not from this field.
   */
  purpose?: string;
  /**
   * Barcode types to try. Omitted formats default to `qr_code`, `code_128`,
   * and `data_matrix` (what Digit generates/recognizes today).
   */
  formats?: DigitHostScanFormat[];
};

/**
 * Result of `DigitHost.scan`. Success is `{ text }`; the user dismissing
 * consent or the scanner is `{ cancelled: true }`. Host errors reject the promise.
 */
export type DigitHostScanResult = { text: string } | { cancelled: true };

/** Read-only host display channel plus host-mediated actions (`window.DigitHost`). */
export type DigitHost = {
  getSettings: () => DigitHostSettings | null;
  onSettingsChange: (
    cb: (settings: DigitHostSettings | null) => void,
  ) => () => void;
  /** Saves a file via the host page. Throws on invalid options (message says why). */
  download: (options: DigitHostDownloadOptions) => void;
  /** Opens the browser print dialog for a sanitized HTML snapshot. */
  print: (options: DigitHostPrintOptions) => void;
  /**
   * Asks Digit to scan a barcode/QR code. Resolves with `{ text }` or
   * `{ cancelled: true }`. Never opens the camera in the iframe.
   */
  scan: (options?: DigitHostScanOptions) => Promise<DigitHostScanResult>;
};

/** Harness credential proxy (`window.DigitProxyClient`) — used by data hooks; not a public app API. */
export type DigitProxyClient = {
  callProxy: (payload: {
    query: string;
    variables?: Record<string, unknown>;
  }) => Promise<unknown>;
  callBackend: (
    path: string,
    options?: { method?: string; body?: unknown },
  ) => Promise<Response>;
};

declare global {
  interface Window {
    DigitHost?: DigitHost;
    DigitProxyClient?: DigitProxyClient;
  }
}

export {};
