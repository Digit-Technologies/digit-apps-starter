import { useCallback, useEffect, useReducer, useState } from "react";

import { printLabel } from "./printLabel";
import type { LabelEntityType, LabelPreviewDocument } from "./types";

export type UseLabelPrintOptions = {
  labelId: string;
  entityType: LabelEntityType;
  /** Id of the inventory record or item to print. */
  entityId: string;
  /** Repeat the label on additional pages (1–50). */
  copies?: number;
  /** Load the preview. Defaults to true; set false to hold off, for example while a dialog is closed. */
  enabled?: boolean;
  /** Called after the host has opened the print dialog. */
  onPrinted?: () => void;
};

export type LabelPrintState = {
  preview: LabelPreviewDocument | null;
  error: string | null;
  loading: boolean;
  printing: boolean;
};

export type LabelPrintAction =
  | { type: "reset" }
  | { type: "load" }
  | { type: "loaded"; preview: LabelPreviewDocument }
  | { type: "failed"; message: string }
  | { type: "print" }
  | { type: "printed" }
  | { type: "printFailed"; message: string };

export const initialLabelPrintState: LabelPrintState = {
  preview: null,
  error: null,
  loading: false,
  printing: false,
};

/** Pure so the state machine is testable without rendering. */
export function labelPrintReducer(state: LabelPrintState, action: LabelPrintAction): LabelPrintState {
  switch (action.type) {
    case "reset":
      return initialLabelPrintState;
    case "load":
      return { ...initialLabelPrintState, loading: true };
    case "loaded":
      return { ...state, preview: action.preview, error: null, loading: false };
    case "failed":
      return { ...state, preview: null, error: action.message, loading: false };
    case "print":
      return { ...state, error: null, printing: true };
    case "printed":
      return { ...state, printing: false };
    case "printFailed":
      return { ...state, error: action.message, printing: false };
  }
}

const messageOf = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

/**
 * Whether Print may be offered. The host leaves data off a label when the app's manifest doesn't
 * declare what it needs, and a label shipped without its MO number is worse than none, so Print
 * stays off until the preview is complete.
 */
export const canPrintPreview = (state: LabelPrintState): boolean =>
  state.preview !== null && !state.printing && state.preview.withheldPermissions.length === 0;

/**
 * Loads a label preview from the host and prints only when `print()` is called. Use it to put a
 * label preview anywhere in the app; `LabelPrintPanel` is this hook with a ready-made layout.
 */
export function useLabelPrint({
  labelId,
  entityType,
  entityId,
  copies,
  enabled = true,
  onPrinted,
}: UseLabelPrintOptions) {
  const [state, dispatch] = useReducer(labelPrintReducer, initialLabelPrintState);
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    if (!enabled) {
      dispatch({ type: "reset" });
      return;
    }

    let cancelled = false;
    dispatch({ type: "load" });
    // Defer past effect cleanup so an unmounted view, or Strict Mode's double invoke, does not
    // spend a host call. The host allows one printLabel per second.
    const timer = setTimeout(() => {
      if (cancelled) return;
      void printLabel({ labelId, entityType, entityId, copies, mode: "preview" })
        .then((preview) => {
          if (!cancelled) dispatch({ type: "loaded", preview });
        })
        .catch((error: unknown) => {
          if (!cancelled) dispatch({ type: "failed", message: messageOf(error, "Failed to render label") });
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, labelId, entityType, entityId, copies, reloads]);

  const print = useCallback(() => {
    dispatch({ type: "print" });
    void printLabel({ labelId, entityType, entityId, copies, mode: "print" })
      .then(() => {
        dispatch({ type: "printed" });
        onPrinted?.();
      })
      .catch((error: unknown) => {
        dispatch({ type: "printFailed", message: messageOf(error, "Failed to print label") });
      });
  }, [labelId, entityType, entityId, copies, onPrinted]);

  const reload = useCallback(() => setReloads((count) => count + 1), []);

  return {
    ...state,
    withheldPermissions: state.preview?.withheldPermissions ?? [],
    canPrint: canPrintPreview(state),
    print,
    reload,
  };
}
