/**
 * Why a label is incomplete, or null when the host left nothing off. The host leaves off data the
 * app's manifest does not declare, and a label shipped without its MO number is worse than none.
 */
export const withheldMessage = (withheld: readonly string[]): string | null =>
  withheld.length === 0
    ? null
    : `Some fields on this label are blank because this app doesn't declare ${withheld.join(", ")} in its manifest permissions. Add them and redeploy before printing.`;
