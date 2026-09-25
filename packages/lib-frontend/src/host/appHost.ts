import type {
  AppHost as AppHostApi,
  AppHostSettings,
  HostInvokeParams,
} from "../globals";

// A parent that never answers shell-ready (not Digit, or too old) fails calls fast, not at the invoke timeout.
const HANDSHAKE_TIMEOUT_MS = 5000;
// Long enough for a call that waits on the user, e.g. scan.
const INVOKE_TIMEOUT_MS = 5 * 60 * 1000;

type Pending = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sanitizeSettings = (value: unknown): AppHostSettings | null => {
  if (!isRecord(value)) return null;
  const settings: AppHostSettings = {};
  if (value.theme === "light" || value.theme === "dark") {
    settings.theme = value.theme;
  }
  if (typeof value.language === "string" && value.language.length <= 35) {
    settings.language = value.language;
  }
  return settings;
};

const capabilityNames = (contract: unknown): string[] => {
  if (!isRecord(contract) || !Array.isArray(contract.capabilities)) return [];
  return contract.capabilities.flatMap((capability) =>
    isRecord(capability) && typeof capability.name === "string"
      ? [capability.name]
      : [],
  );
};

// For a page Digit embeds without the harness (e.g. a custom side-nav link): same wire, spoken directly.
const createEmbeddedHost = (): AppHostApi => {
  let hostOrigin: string | null = null;
  let settings: AppHostSettings | null = null;
  let capabilities: readonly string[] = [];
  let handshakeFailed = false;
  const subscribers = new Set<(settings: AppHostSettings | null) => void>();
  const pending = new Map<string, Pending>();
  const queued: Array<() => void> = [];
  const embedded = window.parent !== window;

  const settle = (
    requestId: string,
    outcome: (entry: Pending) => void,
  ): void => {
    const entry = pending.get(requestId);
    if (!entry) return;
    pending.delete(requestId);
    clearTimeout(entry.timer);
    outcome(entry);
  };

  const failQueued = (): void => {
    handshakeFailed = true;
    queued.length = 0;
    for (const requestId of [...pending.keys()]) {
      settle(requestId, ({ reject }) =>
        reject(new Error("AppHost: no Digit host answered")),
      );
    }
  };

  if (embedded) {
    window.addEventListener("message", (event) => {
      if (event.source !== window.parent) return;
      if (hostOrigin !== null && event.origin !== hostOrigin) return;
      const data: unknown = event.data;
      if (!isRecord(data)) return;

      if (data.type === "digit-apps:settings") {
        const clean = sanitizeSettings(data.settings);
        if (!clean) return;
        hostOrigin = event.origin;
        settings = clean;
        capabilities = Object.freeze(capabilityNames(data.capabilities));
        for (const send of queued.splice(0)) send();
        for (const callback of subscribers) callback(settings);
        return;
      }

      if (
        data.type === "host:invoke-result" &&
        hostOrigin !== null &&
        typeof data.requestId === "string"
      ) {
        settle(data.requestId, ({ resolve, reject }) => {
          if (data.status === "ok") resolve(data.data);
          else if (data.status === "cancelled") resolve(null);
          else
            reject(
              new Error(
                typeof data.message === "string"
                  ? data.message
                  : "AppHost: host error",
              ),
            );
        });
      }
    });
    // Carries nothing, so "*" is fine; the reply fixes the origin everything else goes to.
    window.parent.postMessage({ type: "digit-apps:shell-ready" }, "*");
    setTimeout(() => {
      if (hostOrigin === null) failQueued();
    }, HANDSHAKE_TIMEOUT_MS);
  }

  return {
    getSettings: () => settings,
    onSettingsChange: (callback) => {
      subscribers.add(callback);
      return () => {
        subscribers.delete(callback);
      };
    },
    invoke: (method: string, params: HostInvokeParams = {}) =>
      new Promise((resolve, reject) => {
        if (!embedded || handshakeFailed) {
          reject(new Error("AppHost: not embedded in Digit"));
          return;
        }
        const requestId = crypto.randomUUID();
        const timer = setTimeout(() => {
          settle(requestId, (entry) =>
            entry.reject(new Error(`AppHost: ${method} timed out`)),
          );
        }, INVOKE_TIMEOUT_MS);
        pending.set(requestId, { resolve, reject, timer });
        const send = (): void => {
          if (!pending.has(requestId) || hostOrigin === null) return;
          // Params can carry app data, so they only ever go to the origin the handshake named.
          window.parent.postMessage(
            { type: "host:invoke", requestId, method, params },
            hostOrigin,
          );
        };
        if (hostOrigin === null) queued.push(send);
        else send();
      }),
    get capabilities() {
      return capabilities;
    },
  };
};

let resolved: AppHostApi | null = null;

// Resolved on first use, not at import, so import order against the harness globals never matters.
const host = (): AppHostApi => {
  resolved ??= window.AppHost ?? window.DigitHost ?? createEmbeddedHost();
  return resolved;
};

/** The host page's API, inside Digit's app harness or on a page Digit embeds directly. */
export const AppHost: AppHostApi = Object.freeze({
  getSettings: () => host().getSettings(),
  onSettingsChange: (callback: (settings: AppHostSettings | null) => void) =>
    host().onSettingsChange(callback),
  invoke: (method: string, params?: HostInvokeParams) =>
    host().invoke(method, params),
  get capabilities() {
    return host().capabilities;
  },
});
