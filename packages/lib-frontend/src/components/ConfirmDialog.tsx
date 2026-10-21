import React, { ReactNode, useId } from "react"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

export interface ConfirmDialogProps {
  open: boolean
  /** A short question, such as "Delete role?" */
  title: string
  /** One line on the consequence, such as "This cannot be undone." */
  description?: ReactNode
  /** The answer that goes ahead, such as "Yes, delete" or "Go to users". Not "OK". */
  confirmLabel: string
  /** The answer that backs out, such as "No, keep it". */
  cancelLabel?: string
  /** Makes the confirm button red. Cancel gets focus, so Enter does not delete by accident. */
  destructive?: boolean
  /** An optional 20px icon above the title, such as a warning mark for a blocked action. */
  icon?: ReactNode
  /**
   * An optional icon on the confirm button. Figma's buttons are label-only, so there is none by
   * default.
   */
  confirmIcon?: ReactNode
  /** Shows a spinner on the confirm button and disables cancel while the action runs. */
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * The Figma "Are you sure?" dialog (10741:40048): a small centred card with an optional icon, the
 * question, a description and two equal answer buttons. It has no close X, so the user answers.
 * Use `destructive` for anything that deletes or cannot be undone. Never use the browser
 * `confirm()`; the app iframe blocks it.
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
  const startIcon = confirmIcon ?? undefined

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onCancel}
      aria-labelledby={titleId}
      slotProps={{
        // Stays a centred card on mobile instead of the bottom sheet other dialogs become.
        container: {
          sx: (theme) => ({ [theme.breakpoints.down("sm")]: { alignItems: "center" } }),
        },
        paper: {
          sx: (theme) => ({
            // Figma dialog/width/xxs, and xs (336) on mobile.
            width: 240,
            maxWidth: "calc(100% - 32px)",
            [theme.breakpoints.down("sm")]: {
              width: 336,
              height: "auto",
              maxHeight: "calc(100% - 32px)",
              margin: theme.spacing(2),
              borderRadius: theme.spacing(2),
            },
          }),
        },
      }}
    >
      <Stack sx={{ p: 2, gap: 2 }}>
        <Stack sx={{ gap: 1 }}>
          {icon && (
            <Box sx={{ display: "flex", "& svg": { width: 20, height: 20 } }}>{icon}</Box>
          )}
          <Typography id={titleId} component="h2" variant="h5">
            {title}
          </Typography>
          {description && (
            <Typography variant="body1" color="text.secondary" component="div">
              {description}
            </Typography>
          )}
        </Stack>
        {/* Equal halves of 240px fit two short answers, such as "No, cancel" and "Yes, continue". */}
        <Stack direction="row" sx={{ gap: 1 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={busy}
            autoFocus={destructive}
            sx={{ flex: 1, whiteSpace: "nowrap" }}
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
            sx={{ flex: 1, whiteSpace: "nowrap" }}
          >
            {confirmLabel}
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  )
}
