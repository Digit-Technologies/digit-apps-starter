import React, { type CSSProperties } from "react";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";

import { LabelPreview } from "./LabelPreview";
import { withheldMessage } from "./withheldMessage";
import { type LabelPrintState, type UseLabelPrintOptions, canPrintPreview, useLabelPrint } from "./useLabelPrint";

export type LabelPrintViewProps = {
  state: LabelPrintState;
  onPrint: () => void;
  /** Text of the Print button. */
  printLabelText?: string;
  className?: string;
  style?: CSSProperties;
};

/** The panel's layout for a given state, separate from the hook so it can be rendered on its own. */
export function LabelPrintView({
  state,
  onPrint,
  printLabelText = "Print label",
  className,
  style,
}: LabelPrintViewProps) {
  const withheld = withheldMessage(state.preview?.withheldPermissions ?? []);
  const { preview } = state;
  return (
    <Stack spacing={2} className={className} style={style} data-digit-label-print-panel="">
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      {withheld ? <Alert severity="warning">{withheld}</Alert> : null}
      {state.loading && !preview ? <CircularProgress /> : null}
      {preview ? (
        <LabelPreview
          html={preview.html}
          title={preview.title}
          widthIn={preview.widthIn}
          heightIn={preview.heightIn}
          copies={preview.copies}
        />
      ) : null}
      <div>
        <Button variant="contained" onClick={onPrint} disabled={!canPrintPreview(state)}>
          {printLabelText}
        </Button>
      </div>
    </Stack>
  );
}

export type LabelPrintPanelProps = Omit<UseLabelPrintOptions, "enabled"> & {
  printLabelText?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * An inline label preview with a Print button, to place anywhere in the app (a detail page, a side
 * panel, a table row's expanded area). It previews the label the host renders, shows why a label
 * is incomplete, and prints only when the user clicks Print. For a modal, use `LabelPrintDialog`.
 * To build your own layout, use `useLabelPrint`.
 */
export function LabelPrintPanel({ printLabelText, className, style, ...options }: LabelPrintPanelProps) {
  const { print, preview, error, loading, printing } = useLabelPrint(options);
  return (
    <LabelPrintView
      state={{ preview, error, loading, printing }}
      onPrint={print}
      printLabelText={printLabelText}
      className={className}
      style={style}
    />
  );
}
