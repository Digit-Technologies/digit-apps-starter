import { useEffect, useRef, type CSSProperties } from "react";

import { renderLabelPrintHtml, escapeHtml } from "./render";
import type { RenderLabelPrintHtmlArgs } from "./types";

export type LabelPreviewProps = RenderLabelPrintHtmlArgs & {
  className?: string;
  style?: CSSProperties;
};

/**
 * On-screen preview of the same HTML `printLabel` sends to `DigitHost.print`.
 * Styles are isolated in a shadow root so `@page` / label CSS cannot leak.
 */
export function LabelPreview({
  className,
  style,
  config,
  record,
  copies,
  inlineImage,
}: LabelPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const shadow = root.shadowRoot ?? root.attachShadow({ mode: "open" });
    let cancelled = false;
    void renderLabelPrintHtml({ config, record, copies, inlineImage }).then((html) => {
      if (!cancelled) shadow.innerHTML = html;
    }).catch((error: unknown) => {
      if (!cancelled) {
        const message = error instanceof Error ? error.message : "Failed to render label.";
        shadow.innerHTML = `<p style="font:12px sans-serif;color:#b42318;margin:8px">${escapeHtml(message)}</p>`;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [config, record, copies, inlineImage]);

  return <div ref={ref} className={className} style={style} data-digit-label-preview="" />;
}
