export {};

declare global {
  interface Window {
    DigitProxyClient?: {
      callProxy: (payload: {
        query: string;
        variables?: Record<string, unknown>;
      }) => Promise<unknown>;
    };
  }
}
