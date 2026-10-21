import React, { ReactNode, useId } from "react"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Dialog, { DialogProps } from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import IconButton from "@mui/material/IconButton"
import Stack from "@mui/material/Stack"
import { SxProps, Theme } from "@mui/material/styles"
import Typography from "@mui/material/Typography"

import { X } from "../icons"
import { neutral } from "../theme/colors"

export interface ModalFooterProps {
  /** Adds a text "Cancel" button on the left. */
  onCancel?: () => void
  cancelLabel?: string
  /** A contained-secondary Button, left of the primary. */
  secondary?: ReactNode
  /** The contained-primary Button, last on the right. */
  primary: ReactNode
}

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  /** One line under the title, in the secondary colour. */
  subtitle?: ReactNode
  /** MUI Tabs that switch the whole content area. They sit in the header, so they never scroll. */
  tabs?: ReactNode
  /** Header items before the close button, such as an overflow menu. */
  actions?: ReactNode
  /** Figma dialog/width: xs 336, sm 480 (default), md 680, lg 960. */
  width?: "xs" | "sm" | "md" | "lg"
  /** Takes the full height of the viewport (less 32px each side), so the footer stays put. */
  fullHeight?: boolean
  /** One or more `ModalSection`s, or any content (it gets 16px padding). */
  children: ReactNode
  footer?: ModalFooterProps
  /** Passed to the MUI Dialog, for example `disablePortal` or `TransitionProps`. */
  DialogProps?: Partial<Omit<DialogProps, "open" | "onClose" | "children">>
}

/**
 * The footer row shared by Modal and SidePanel: Cancel on the left, secondary and primary on
 * the right.
 */
export const ModalFooter = ({ onCancel, cancelLabel = "Cancel", secondary, primary }: ModalFooterProps) => (
  <>
    {onCancel && (
      <Button variant="text" onClick={onCancel}>
        {cancelLabel}
      </Button>
    )}
    <Stack direction="row" sx={{ gap: 1, ml: "auto", alignItems: "center" }}>
      {secondary}
      {primary}
    </Stack>
  </>
)

export interface ModalHeaderProps {
  title: ReactNode
  titleId?: string
  subtitle?: ReactNode
  actions?: ReactNode
  onClose?: () => void
  /** Shown before the title, such as a back IconButton. */
  leading?: ReactNode
  tabs?: ReactNode
  sx?: SxProps<Theme>
}

/** The Figma Modal header: title (and subtitle), actions, then the close X. */
export const ModalHeader = ({ title, titleId, subtitle, actions, onClose, leading, tabs, sx }: ModalHeaderProps) => (
  <Box
    sx={[
      (theme) => ({
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        gap: 1,
        p: 2,
        // With tabs the header's own line closes the tab row.
        pb: tabs ? 0 : 2,
        borderBottom: `1px solid ${theme.palette.border.strong}`,
        "& .MuiTabs-root": { borderBottom: 0 },
      }),
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
      {leading}
      <Stack sx={{ flex: 1, minWidth: 0, gap: 0.5, minHeight: 28, justifyContent: "center" }}>
        <Typography id={titleId} variant="h5" component="h2">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>
      {actions && <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>{actions}</Box>}
      {onClose && (
        // Figma: the modal close icon is at full opacity, in the primary colour.
        <IconButton aria-label="Close" size="small" onClick={onClose} sx={{ color: "text.primary" }}>
          <X size={16} />
        </IconButton>
      )}
    </Box>
    {tabs}
  </Box>
)

export interface ModalSectionProps {
  /** An h6 section title. */
  title?: ReactNode
  /** Right side of the title row, such as an add button. */
  action?: ReactNode
  children?: ReactNode
  sx?: SxProps<Theme>
}

/**
 * One block of Modal or SidePanel content: 16px padding, 16px between children, and a line
 * under it (none under the last section).
 */
export const ModalSection = ({ title, action, children, sx }: ModalSectionProps) => (
  <Box
    className="digit-ModalSection"
    sx={[
      (theme) => ({
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: 2,
        // Figma containers/cards/border/solid/default (#ededed). Dark uses the solid default line.
        borderBottom: `1px solid ${theme.palette.mode === "dark" ? theme.palette.border.solidDefault : neutral[150]}`,
        "&:last-child": { borderBottom: 0 },
      }),
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {(title || action) && (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 20 }}>
        {title && (
          <Typography variant="h6" component="h3" sx={{ flex: 1 }}>
            {title}
          </Typography>
        )}
        {action && <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>{action}</Box>}
      </Box>
    )}
    {children}
  </Box>
)

/**
 * The Figma Modal (form dialog): a header with the title, optional subtitle and tabs, and a close
 * X; scrolling content; and a footer with Cancel on the left and the actions on the right. Use it
 * instead of hand-rolling a Dialog. For a yes/no question use ConfirmDialog.
 *
 * ```tsx
 * <Modal open={open} onClose={close} title="Edit item"
 *   footer={{ onCancel: close, primary: <Button variant="contained" color="primary">Save</Button> }}>
 *   <ModalSection title="General">…</ModalSection>
 * </Modal>
 * ```
 */
export const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  tabs,
  actions,
  width = "sm",
  fullHeight = false,
  children,
  footer,
  DialogProps,
}: ModalProps) => {
  const titleId = useId()
  const paperSlot = (DialogProps?.slotProps?.paper ?? {}) as { sx?: SxProps<Theme> }
  const paperSx: SxProps<Theme> = [
    (theme) =>
      fullHeight
        ? {
            height: "calc(100% - 64px)",
            // The mobile sheet already fills to the bottom.
            [theme.breakpoints.down("sm")]: { height: "calc(100% - 20px)" },
          }
        : {},
    ...(Array.isArray(paperSlot.sx) ? paperSlot.sx : [paperSlot.sx]),
  ]
  return (
    <Dialog
      {...DialogProps}
      open={open}
      onClose={onClose}
      maxWidth={width}
      fullWidth
      aria-labelledby={titleId}
      slotProps={{
        ...DialogProps?.slotProps,
        paper: { ...paperSlot, sx: paperSx },
      }}
    >
      <ModalHeader title={title} titleId={titleId} subtitle={subtitle} actions={actions} onClose={onClose} tabs={tabs} />
      <DialogContent>{children}</DialogContent>
      {footer && (
        <DialogActions>
          <ModalFooter {...footer} />
        </DialogActions>
      )}
    </Dialog>
  )
}
