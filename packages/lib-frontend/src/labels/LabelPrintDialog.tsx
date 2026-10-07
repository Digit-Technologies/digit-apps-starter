import React, { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

import { LabelPreview } from "./LabelPreview";
import { printLabel } from "./printLabel";
import type { LabelEntityType, LabelPreviewDocument } from "./types";

export type LabelPrintDialogProps = {
  open: boolean;
  onClose: () => void;
  labelId: string;
  entityType: LabelEntityType;
  /** Id of the inventory record or item to print. */
  entityId: string;
  /** Repeat the label on additional pages (1–50). */
  copies?: number;
  /** Called after the host has opened the print dialog. */
  onPrinted?: () => void;
};

/**
 * Why a label is incomplete, or null when the host left nothing off. The host leaves off data the
 * app's manifest does not declare, and a label shipped without its MO number is worse than none.
 */
export const withheldMessage = (withheld: readonly string[]): string | null =>
  withheld.length === 0
    ? null
    : `Some fields on this label are blank because this app doesn't declare ${withheld.join(", ")} in its manifest permissions. Add them and redeploy before printing.`;

const messageOf = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

/**
 * Loads a label preview from the host and prints only when the user clicks Print.
 * Closing the dialog does not print.
 */
export function LabelPrintDialog({
  open,
  onClose,
  labelId,
  entityType,
  entityId,
  copies,
  onPrinted,
}: LabelPrintDialogProps) {
  const [preview, setPreview] = useState<LabelPreviewDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setError(null);
      setLoading(false);
      setPrinting(false);
      return;
    }

    let cancelled = false;
    setPreview(null);
    setError(null);
    setLoading(true);
    // Defer past effect cleanup so a closed dialog, or Strict Mode's double invoke, does not
    // spend a host call. The host allows one printLabel per second.
    const timer = setTimeout(() => {
      if (cancelled) return;
      void printLabel({ labelId, entityType, entityId, copies, mode: "preview" })
        .then((document) => {
          if (!cancelled) setPreview(document);
        })
        .catch((err: unknown) => {
          if (!cancelled) setError(messageOf(err, "Failed to render label"));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, labelId, entityType, entityId, copies]);

  const confirmPrint = (): void => {
    setPrinting(true);
    setError(null);
    void printLabel({ labelId, entityType, entityId, copies, mode: "print" })
      .then(() => {
        onPrinted?.();
        onClose();
      })
      .catch((err: unknown) => {
        setError(messageOf(err, "Failed to print label"));
      })
      .finally(() => {
        setPrinting(false);
      });
  };

  return (
    <Dialog open={open} onClose={printing ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{preview?.title ?? "Label"}</DialogTitle>
      <DialogContent>
        {error ? (
          <Alert severity="error" sx={{ mb: preview ? 2 : 0 }}>
            {error}
          </Alert>
        ) : null}
        {preview && withheldMessage(preview.withheldPermissions) ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {withheldMessage(preview.withheldPermissions)}
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
        <Button
          variant="contained"
          onClick={confirmPrint}
          disabled={!preview || printing || preview.withheldPermissions.length > 0}
        >
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
}
