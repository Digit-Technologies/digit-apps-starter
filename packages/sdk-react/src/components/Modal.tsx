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

import { X } from "../icons.js"
import { sectionClassName, sectionHeaderClassName } from "./Section.js"

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
  /** One or more `Section`s, which become padded bands, or any content (it gets 16px padding). */
  children: ReactNode
  footer?: ModalFooterProps
  /** Passed to the MUI Dialog, for example `disablePortal` or `TransitionProps`. */
  DialogProps?: Partial<Omit<DialogProps, "open" | "onClose" | "children">>
}

/**
 * The footer row shared by Modal and SidePanel: Cancel on the left, secondary and primary on
 * the right. Internal: apps pass `footer` to Modal or SidePanel.
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

interface ModalHeaderProps {
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

/** The Figma Modal header: title (and subtitle), actions, then the close X. Internal. */
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

/**
 * Lays out the direct `Section` children of a Modal or SidePanel body as Figma modal sections:
 * 16px padding, 16px between children, a 20px title row, and a line under each one but the last.
 * The body drops its own padding when it holds sections. Internal.
 */
export const modalSectionBandsSx = (theme: Theme) => ({
  [`&:has(> .${sectionClassName})`]: { p: 0 },
  [`& > .${sectionClassName}`]: {
    p: 2,
    borderBottom: `1px solid ${theme.palette.border.solidCard}`,
    "&:last-child": { borderBottom: 0 },
    [`& > .${sectionHeaderClassName}`]: { minHeight: 20 },
  },
})

/**
 * The Figma Modal (form dialog): a header with the title, optional subtitle and tabs, and a close
 * X; scrolling content; and a footer with Cancel on the left and the actions on the right. Use it
 * instead of hand-rolling a Dialog. For a yes/no question use ConfirmDialog.
 *
 * ```tsx
 * <Modal open={open} onClose={close} title="Edit item"
 *   footer={{ onCancel: close, primary: <Button variant="contained" color="primary">Save</Button> }}>
 *   <Section title="General">…</Section>
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
      <DialogContent sx={modalSectionBandsSx}>{children}</DialogContent>
      {footer && (
        <DialogActions>
          <ModalFooter {...footer} />
        </DialogActions>
      )}
    </Dialog>
  )
}
