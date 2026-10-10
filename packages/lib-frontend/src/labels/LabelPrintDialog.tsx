import React from "react";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

import { LabelPreview } from "./LabelPreview";
import { type UseLabelPrintOptions, useLabelPrint } from "./useLabelPrint";

export type LabelPrintDialogProps = Omit<UseLabelPrintOptions, "enabled"> & {
  open: boolean;
  onClose: () => void;
};

/**
 * `LabelPrintPanel` in a modal. Closing the dialog does not print. Prefer the panel (or
 * `useLabelPrint`) when the label belongs on the page itself.
 */
export function LabelPrintDialog({ open, onClose, onPrinted, ...options }: LabelPrintDialogProps) {
  const { preview, error, loading, printing, canPrint, print } = useLabelPrint({
    ...options,
    enabled: open,
    onPrinted: () => {
      onPrinted?.();
      onClose();
    },
  });

  return (
    <Dialog open={open} onClose={printing ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{preview?.title ?? "Label"}</DialogTitle>
      <DialogContent>
        {error ? (
          <Alert severity="error" sx={{ mb: preview ? 2 : 0 }}>
            {error}
          </Alert>
        ) : null}
        {preview ? (
          <LabelPreview
            html={preview.html}
            title={preview.title}
            widthIn={preview.widthIn}
            heightIn={preview.heightIn}
            copies={preview.copies}
          />
        ) : null}
        {loading && !preview ? <CircularProgress /> : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={printing}>
          Close
        </Button>
        <Button variant="contained" onClick={print} disabled={!canPrint}>
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
}
