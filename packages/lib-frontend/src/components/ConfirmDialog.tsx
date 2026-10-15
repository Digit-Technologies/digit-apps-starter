import React, { ReactNode } from "react"

import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import Typography from "@mui/material/Typography"

export interface ConfirmDialogProps {
  open: boolean
  /** A short question, such as "Delete role?" */
  title: string
  /** One line on the consequence, such as "This cannot be undone." */
  description?: ReactNode
  /** The action verb, such as "Delete" or "Go to users". Not "OK". */
  confirmLabel: string
  cancelLabel?: string
  /** Makes the confirm button red. Cancel gets focus, so Enter does not delete by accident. */
  destructive?: boolean
  /** An optional leading icon, such as a warning mark for a blocked action. */
  icon?: ReactNode
  /** Disables both buttons while the action runs. */
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * A small centred dialog that asks before an action. Use `destructive` for anything that
 * deletes or cannot be undone. Use it with a non-destructive label for a blocked action
 * that needs a fix first. Never use the browser `confirm()`; the app iframe blocks it.
 */
export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  icon,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => (
  <Dialog
    open={open}
    onClose={busy ? undefined : onCancel}
    maxWidth="xs"
    fullWidth
    aria-labelledby="confirm-dialog-title"
  >
    <DialogTitle
      id="confirm-dialog-title"
      sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1.5, fontWeight: 600 }}
    >
      {icon}
      {title}
    </DialogTitle>
    {description && (
      <DialogContent sx={{ pt: 0 }}>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </DialogContent>
    )}
    <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: "space-between" }}>
      <Button
        variant="text"
        color="inherit"
        onClick={onCancel}
        disabled={busy}
        autoFocus={destructive}
      >
        {cancelLabel}
      </Button>
      <Button
        variant="contained"
        color={destructive ? "error" : "primary"}
        onClick={onConfirm}
        disabled={busy}
      >
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
)
