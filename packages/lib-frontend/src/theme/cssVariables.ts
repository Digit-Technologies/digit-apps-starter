/**
 * Syncs `data-theme` on the document root so tokens.css light/dark
 * custom properties apply. Call whenever dark mode changes.
 */
export function applyThemeCssVariables(darkMode: boolean): void {
  if (typeof document === "undefined") return
  document.documentElement.dataset.theme = darkMode ? "dark" : "light"
}
