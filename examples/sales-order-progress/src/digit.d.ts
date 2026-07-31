export {};

interface DigitHost {
  getSettings: () => { theme?: 'light' | 'dark'; language?: string } | null;
  onSettingsChange: (cb: (s: { theme?: 'light' | 'dark'; language?: string }) => void) => () => void;
}

declare global {
  interface Window {
    DigitProxyClient?: {
      callProxy: (payload: {
        query: string;
        variables?: Record<string, unknown>;
      }) => Promise<unknown>;
    };
    DigitHost?: DigitHost;
  }
}
