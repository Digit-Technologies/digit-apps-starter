import React, { ReactNode } from "react"

import Box from "@mui/material/Box"
import ButtonBase from "@mui/material/ButtonBase"
import IconButton from "@mui/material/IconButton"
import Typography from "@mui/material/Typography"

import { ChevronRight, X } from "../icons"

export interface Crumb {
  label: string
  onClick?: () => void
}

export interface PageHeaderProps {
  title: string
  /** Parent crumbs. When set, `title` renders as the current crumb. */
  trail?: Crumb[]
  /** Inline caption after the title, such as "Let's get Acme set up". */
  subtitle?: string
  /** Right side, before the close button. */
  actions?: ReactNode
  /** Adds a close button. Use it as the cancel for a panel or dialog. */
  onClose?: () => void
  /** MUI Tabs, under the title row and above the divider. */
  tabs?: ReactNode
  variant?: "page" | "dialog"
}

/**
 * The title row at the top of a screen, side panel or form dialog. Use `trail` for a detail
 * screen under a list. Use `variant="dialog"` inside a Dialog, where the divider is not wanted.
 */
export const PageHeader = ({
  title,
  trail,
  subtitle,
  actions,
  onClose,
  tabs,
  variant = "page",
}: PageHeaderProps) => {
  const isDialog = variant === "dialog"

  return (
    <Box
      sx={(theme) => ({
        px: isDialog ? 2.5 : 2,
        pt: isDialog ? 2.5 : 0,
        pb: isDialog ? 1 : 0,
        minHeight: isDialog ? undefined : 52,
        borderBottom: isDialog ? undefined : `1px solid ${theme.palette.divider}`,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minHeight: isDialog ? 32 : 52 }}>
        {trail?.map((crumb) => (
          <React.Fragment key={crumb.label}>
            {crumb.onClick ? (
              <ButtonBase onClick={crumb.onClick} sx={{ borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.primary">
                  {crumb.label}
                </Typography>
              </ButtonBase>
            ) : (
              <Typography variant="subtitle2" color="text.primary">
                {crumb.label}
              </Typography>
            )}
            <Box component="span" sx={{ color: "text.tertiary", display: "inline-flex" }}>
              <ChevronRight size={14} />
            </Box>
          </React.Fragment>
        ))}
        {trail ? (
          <Typography variant="subtitle2" color="text.tertiary" component="span" aria-current="page">
            {title}
          </Typography>
        ) : (
          <Typography variant="h5" component="h1">
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography variant="body1" color="text.secondary" component="span" sx={{ ml: 1 }}>
            {subtitle}
          </Typography>
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: "auto" }}>
          {actions}
          {onClose && (
            <IconButton aria-label="Close" size="small" onClick={onClose}>
              <X size={16} />
            </IconButton>
          )}
        </Box>
      </Box>
      {tabs}
    </Box>
  )
}
