/** Display settings pushed host → frame by digit-web. */
export type DigitHostSettings = {
  theme?: 'light' | 'dark';
  language?: string;
};

/** Read-only host display channel (`window.DigitHost`). */
export type DigitHost = {
  getSettings: () => DigitHostSettings | null;
  onSettingsChange: (cb: (settings: DigitHostSettings | null) => void) => () => void;
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
