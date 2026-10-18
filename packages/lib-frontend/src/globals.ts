/** Display settings pushed host → frame by digit-web. */
export type AppHostSettings = {
  theme?: "light" | "dark";
  language?: string;
};

/** Params for `invoke("download", ...)` — the only way an app can save a file to disk. */
export type AppHostDownloadOptions = {
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

/** Params for `invoke("print", ...)`. The host sanitizes and prints this HTML snapshot. */
export type AppHostPrintOptions = {
  /** ASCII letters/digits, spaces, dots, hyphens, underscores or parentheses; 119 chars max. */
  title: string;
  /** Self-contained printable HTML, 10MB max after inlining styles and assets. */
  html: string;
};

/** Params passed to `AppHost.invoke` — a plain JSON-serializable object, `{}` when a capability takes none. */
export type HostInvokeParams = Record<string, unknown>;

/** Read-only host display channel plus host-mediated actions. */
export type AppHost = {
  getSettings: () => AppHostSettings | null;
  onSettingsChange: (
    cb: (settings: AppHostSettings | null) => void,
  ) => () => void;
  /**
   * Calls a host capability: resolves with data, `null` if the user cancelled, rejects on
   * error — including when this host does not offer the method.
   */
  invoke: (method: string, params?: HostInvokeParams) => Promise<unknown>;
  /** The method names this host offers. Diagnostics only — just call `invoke`. */
  readonly capabilities: readonly string[];
};

/** @deprecated Use `AppHostSettings`. */
export type DigitHostSettings = AppHostSettings;
/** @deprecated Use `AppHostDownloadOptions`. */
export type DigitHostDownloadOptions = AppHostDownloadOptions;
/** @deprecated Use `AppHostPrintOptions`. */
export type DigitHostPrintOptions = AppHostPrintOptions;

/** @deprecated Use `AppHost` from this package. Older harness global, kept for existing apps. */
export type DigitHost = AppHost & {
  /** @deprecated Use `invoke("download", ...)`. Saves a file via the host page; throws on invalid options. */
  download: (options: DigitHostDownloadOptions) => void;
  /** @deprecated Use `invoke("print", ...)`. Opens the browser print dialog for a sanitized HTML snapshot. */
  print: (options: DigitHostPrintOptions) => void;
};

/** Harness credential proxy (`window.AppProxy`) — used by data hooks; not a public app API. */
export type AppProxy = {
  callProxy: (payload: {
    query: string;
    variables?: Record<string, unknown>;
  }) => Promise<unknown>;
  callBackend: (
    path: string,
    options?: { method?: string; body?: unknown },
  ) => Promise<Response>;
};

/** @deprecated Use `AppProxy`. */
export type DigitProxyClient = AppProxy;

declare global {
  interface Window {
    AppHost?: AppHost;
    AppProxy?: AppProxy;
    DigitHost?: DigitHost;
    DigitProxyClient?: DigitProxyClient;
  }
}

export {};
