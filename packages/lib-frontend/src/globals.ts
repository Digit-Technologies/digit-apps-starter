/** Display settings pushed host → frame by digit-web. */
export type SuttonHostSettings = {
  theme?: "light" | "dark";
  language?: string;
};

/** Options for `SuttonHost.download` — the only way an app can save a file to disk. */
export type SuttonHostDownloadOptions = {
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

/** Options for `SuttonHost.print`. The host sanitizes and prints this HTML snapshot. */
export type SuttonHostPrintOptions = {
  /** ASCII letters/digits, spaces, dots, hyphens, underscores or parentheses; 119 chars max. */
  title: string;
  /** Self-contained printable HTML, 10MB max after inlining styles and assets. */
  html: string;
};

/** Read-only host display channel plus host-mediated actions (`window.SuttonHost`). */
export type SuttonHost = {
  getSettings: () => SuttonHostSettings | null;
  onSettingsChange: (
    cb: (settings: SuttonHostSettings | null) => void,
  ) => () => void;
  /** Saves a file via the host page. Throws on invalid options (message says why). */
  download: (options: SuttonHostDownloadOptions) => void;
  /** Opens the browser print dialog for a sanitized HTML snapshot. */
  print: (options: SuttonHostPrintOptions) => void;
};

/** Harness credential proxy (`window.SuttonProxyClient`) — used by data hooks; not a public app API. */
export type SuttonProxyClient = {
  callProxy: (payload: {
    query: string;
    variables?: Record<string, unknown>;
  }) => Promise<unknown>;
  callBackend: (
    path: string,
    options?: { method?: string; body?: unknown },
  ) => Promise<Response>;
};

/**
 * @deprecated Use {@link SuttonHostSettings}. Will be removed in a later release.
 */
export type DigitHostSettings = SuttonHostSettings;
/**
 * @deprecated Use {@link SuttonHostDownloadOptions}. Will be removed in a later release.
 */
export type DigitHostDownloadOptions = SuttonHostDownloadOptions;
/**
 * @deprecated Use {@link SuttonHostPrintOptions}. Will be removed in a later release.
 */
export type DigitHostPrintOptions = SuttonHostPrintOptions;
/**
 * @deprecated Use {@link SuttonHost}. Will be removed in a later release.
 */
export type DigitHost = SuttonHost;
/**
 * @deprecated Use {@link SuttonProxyClient}. Will be removed in a later release.
 */
export type DigitProxyClient = SuttonProxyClient;

declare global {
  interface Window {
    /** Host-injected global. Prefer `window.SuttonHost` in app code. */
    DigitHost?: SuttonHost;
    /** Host-injected global. Prefer `window.SuttonProxyClient` in app code. */
    DigitProxyClient?: SuttonProxyClient;
    SuttonHost?: SuttonHost;
    SuttonProxyClient?: SuttonProxyClient;
  }
}

function aliasWindowProp(
  from: "DigitHost" | "DigitProxyClient",
  to: "SuttonHost" | "SuttonProxyClient",
) {
  if (typeof window === "undefined") return;
  if (Object.prototype.hasOwnProperty.call(window, to)) return;
  Object.defineProperty(window, to, {
    configurable: true,
    enumerable: true,
    get() {
      return window[from];
    },
    set(value) {
      window[from] = value;
    },
  });
}

aliasWindowProp("DigitHost", "SuttonHost");
aliasWindowProp("DigitProxyClient", "SuttonProxyClient");
