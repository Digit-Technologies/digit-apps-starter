import React, { ReactNode } from "react"

import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import IconButton from "@mui/material/IconButton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

import { X } from "../icons"

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
    <DialogTitle id="confirm-dialog-title" component="div">
      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        {icon}
        <IconButton aria-label="Close" size="small" onClick={onCancel} disabled={busy}>
          <X size={16} />
        </IconButton>
      </Stack>
      <Typography component="h2" variant="h5" sx={{ mt: icon ? 1.5 : 0 }}>
        {title}
      </Typography>
    </DialogTitle>
    {description && (
      <DialogContent>
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
      </DialogContent>
    )}
    <DialogActions sx={{ justifyContent: "space-between" }}>
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
