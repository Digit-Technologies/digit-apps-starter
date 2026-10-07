import React, { type CSSProperties } from "react";

import type { LabelPreviewDocument } from "./types";

export type LabelPreviewProps = Omit<LabelPreviewDocument, "withheldPermissions"> & {
  className?: string;
  style?: CSSProperties;
};

/**
 * Shows host preview HTML. The iframe sandbox is empty so the document cannot run script, reach
 * the app, or open a print dialog — printing is a separate `printLabel` call with `mode: "print"`.
 */
export function LabelPreview({
  html,
  title,
  widthIn,
  heightIn,
  copies,
  className,
  style,
}: LabelPreviewProps) {
  const pages = Number.isFinite(copies) ? Math.max(1, Math.floor(copies)) : 1;
  return (
    <iframe
      className={className}
      data-digit-label-preview=""
      title={title}
      sandbox=""
      srcDoc={html}
      referrerPolicy="no-referrer"
      style={{
        display: "block",
        width: `${widthIn}in`,
        height: `${heightIn * pages}in`,
        border: 0,
        background: "white",
        ...style,
      }}
    />
  );
}
