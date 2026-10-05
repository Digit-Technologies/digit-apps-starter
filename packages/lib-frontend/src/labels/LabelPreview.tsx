import { useEffect, useRef, type CSSProperties } from "react";

import { renderLabel } from "./render";
import type { RenderLabelArgs } from "./types";

export type LabelPreviewProps = Omit<RenderLabelArgs, "title"> & {
  className?: string;
  style?: CSSProperties;
};

// The host rate-limits renderLabel, so edits settle before a render is requested.
const RENDER_DEBOUNCE_MS = 300;

const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * On-screen preview of the label `printLabel` prints, rendered by the host. Styles are isolated in a
 * shadow root so `@page` / label CSS cannot leak.
 */
export function LabelPreview({ className, style, config, record, copies, host }: LabelPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Apps often build these inline; compare by content so a re-render doesn't re-render the label.
  const inputKey = JSON.stringify([config, record, copies]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const shadow = root.shadowRoot ?? root.attachShadow({ mode: "open" });
    let cancelled = false;
    const timer = setTimeout(() => {
      renderLabel({ config, record, copies, host })
        .then((label) => {
          if (!cancelled) shadow.innerHTML = label.html;
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          const message = error instanceof Error ? error.message : "Failed to render label.";
          shadow.innerHTML = `<p style="font:12px sans-serif;color:#b42318;margin:8px">${escapeHtml(message)}</p>`;
        });
    }, RENDER_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // inputKey carries the content of config / record / copies.
  }, [inputKey, host]);

  return <div ref={ref} className={className} style={style} data-digit-label-preview="" />;
}
