/**
 * Syncs `data-theme` on the document root with the active MUI theme mode
 * (matches DigitHost / harness light-dark). Call whenever dark mode changes.
 */
export function applyThemeCssVariables(darkMode: boolean): void {
  if (typeof document === "undefined") return
  document.documentElement.dataset.theme = darkMode ? "dark" : "light"
}
