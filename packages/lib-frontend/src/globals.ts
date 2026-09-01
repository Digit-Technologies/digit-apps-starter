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
