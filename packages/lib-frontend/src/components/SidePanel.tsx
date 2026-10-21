import React, { ReactNode, useId } from "react"

import Box from "@mui/material/Box"
import Drawer, { DrawerProps } from "@mui/material/Drawer"
import IconButton from "@mui/material/IconButton"
import { SxProps, Theme } from "@mui/material/styles"

import { ArrowLeft } from "../icons"
import { outer } from "../theme/shadows"
import { ModalFooter, ModalFooterProps, ModalHeader } from "./Modal"

export interface SidePanelProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  /** Header items before the close button, such as an overflow menu. */
  actions?: ReactNode
  /** Adds a back arrow before the title, for a panel that drilled into a child record. */
  onBack?: () => void
  /** MUI Tabs under the title row, such as Details | Layout. */
  tabs?: ReactNode
  /** Cancel on the left, secondary and primary on the right. */
  footer?: ModalFooterProps
  /** `ModalSection`s, or any content (it gets 16px padding). */
  children: ReactNode
  /**
   * `overlay` (default): a 448px panel that floats over a list page with a shadow and no
   * backdrop, so the list stays usable. `docked`: a 367px column in the page layout, on the
   * secondary background, for a record page's details.
   */
  variant?: "overlay" | "docked"
  /** Overrides the width (448 overlay, 367 docked). */
  width?: number | string
  /** Passed to the MUI Drawer of the overlay variant, for example `disablePortal`. */
  DrawerProps?: Partial<Omit<DrawerProps, "open" | "onClose" | "variant" | "anchor" | "children">>
  sx?: SxProps<Theme>
}

const PanelBody = ({ title, titleId, actions, onBack, onClose, tabs, footer, children, solid }: SidePanelProps & { titleId: string; solid: boolean }) => (
  <>
    <ModalHeader
      title={title}
      titleId={titleId}
      actions={actions}
      onClose={onClose}
      tabs={tabs}
      leading={
        onBack && (
          <IconButton aria-label="Back" size="small" onClick={onBack} sx={{ color: "text.primary" }}>
            <ArrowLeft size={16} />
          </IconButton>
        )
      }
      // Record-page chrome uses the solid line; the floating panel uses the 10% line.
      sx={solid ? (theme) => ({ borderBottomColor: theme.palette.border.solidStrong }) : undefined}
    />
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        p: 2,
        "&:has(> .digit-ModalSection)": { p: 0 },
      }}
    >
      {children}
    </Box>
    {footer && (
      <Box
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexShrink: 0,
          p: 2,
          borderTop: `1px solid ${solid ? theme.palette.border.solidStrong : theme.palette.border.strong}`,
        })}
      >
        <ModalFooter {...footer} />
      </Box>
    )}
  </>
)

/**
 * The right-hand details and settings panel from the product mockups: a header with the title
 * and a close X, a scrolling body, and an optional footer. Use `variant="overlay"` on list pages
 * (opens over the table) and `variant="docked"` on record pages (sits beside the record card).
 */
export const SidePanel = (props: SidePanelProps) => {
  const { open, onClose, variant = "overlay", width, DrawerProps, sx } = props
  const titleId = useId()

  if (variant === "docked") {
    if (!open) return null
    return (
      <Box
        component="aside"
        aria-labelledby={titleId}
        sx={[
          (theme) => ({
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            width: width ?? 367,
            maxWidth: "100%",
            height: "100%",
            minHeight: 0,
            bgcolor: "background.secondary",
            borderLeft: `1px solid ${theme.palette.border.solidStrong}`,
          }),
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        <PanelBody {...props} titleId={titleId} solid />
      </Box>
    )
  }

  return (
    <Drawer
      {...DrawerProps}
      // Persistent: no backdrop and no focus trap, so the list behind stays usable.
      variant="persistent"
      anchor="right"
      open={open}
      onClose={onClose}
      onKeyDown={(event: React.KeyboardEvent) => {
        if (event.key === "Escape") onClose()
      }}
      slotProps={{
        ...DrawerProps?.slotProps,
        paper: {
          ...(DrawerProps?.slotProps?.paper as object | undefined),
          role: "dialog",
          "aria-labelledby": titleId,
          sx: [
            (theme) => ({
              width: width ?? 448,
              maxWidth: "100%",
              bgcolor: "background.paper",
              backgroundImage: "none",
              border: 0,
              borderLeft: `1px solid ${theme.palette.border.strong}`,
              boxShadow: outer.lg,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }),
            ...(Array.isArray(sx) ? sx : [sx]),
          ],
        },
      }}
    >
      <PanelBody {...props} titleId={titleId} solid={false} />
    </Drawer>
  )
}
