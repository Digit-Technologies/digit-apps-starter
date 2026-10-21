import React, { ReactNode, useId } from "react"

import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

import { Check, Trash2 } from "../icons"

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
  /**
   * The icon on the confirm button. Defaults to a trash can when `destructive` and a check mark
   * otherwise. Pass `null` for a label-only button.
   */
  confirmIcon?: ReactNode
  /** Shows a spinner on the confirm button and disables cancel while the action runs. */
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
  confirmIcon,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const titleId = useId()
  const startIcon =
    confirmIcon === undefined
      ? destructive
        ? <Trash2 size={16} />
        : <Check size={16} />
      : confirmIcon ?? undefined

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onCancel}
      aria-labelledby={titleId}
      slotProps={{ paper: { sx: { width: 240, maxWidth: "calc(100% - 32px)" } } }}
    >
      <Stack sx={{ p: 2, gap: 2 }}>
        <Stack sx={{ gap: 1 }}>
          {icon}
          <Typography id={titleId} component="h2" variant="h5">
            {title}
          </Typography>
          {description && (
            <Typography variant="body1" color="text.secondary">
              {description}
            </Typography>
          )}
        </Stack>
        <Stack direction="row" sx={{ gap: 1 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={busy}
            autoFocus={destructive}
            sx={{ flex: 1 }}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="contained"
            color={destructive ? "error" : "primary"}
            onClick={onConfirm}
            loading={busy}
            loadingPosition={startIcon ? "start" : "center"}
            startIcon={startIcon}
            sx={{ flex: 1 }}
          >
            {confirmLabel}
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  )
}
