import React, { ReactNode } from "react"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
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
        borderBottom: isDialog ? undefined : `1px solid ${theme.palette.border.strong}`,
      })}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          boxSizing: "border-box",
          height: 60,
          px: 4.5,
          pt: 2,
          pb: tabs ? 1 : 2,
          "@media (max-width: 599px)": { px: 2.5 },
        }}
      >
        {trail?.map((crumb) => (
          <React.Fragment key={crumb.label}>
            {crumb.onClick ? (
              <Button
                variant="text"
                size="small"
                color="inherit"
                onClick={crumb.onClick}
                sx={{ height: 28, px: 1, borderRadius: "8px" }}
              >
                <Typography variant="subtitle2" color="text.primary" component="span">
                  {crumb.label}
                </Typography>
              </Button>
            ) : (
              <Typography variant="subtitle2" color="text.primary">
                {crumb.label}
              </Typography>
            )}
            <Box component="span" sx={{ opacity: 0.6, display: "inline-flex" }}>
              <ChevronRight size={16} />
            </Box>
          </React.Fragment>
        ))}
        {trail ? (
          <Typography variant="subtitle2" color="text.disabled" component="span" aria-current="page">
            {title}
          </Typography>
        ) : (
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography variant="body1" color="text.secondary" component="span" sx={{ ml: 1 }}>
            {subtitle}
          </Typography>
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}>
          {actions}
          {onClose && (
            <IconButton aria-label="Close" size="small" onClick={onClose} sx={{ "& svg": { opacity: 0.6 } }}>
              <X size={16} />
            </IconButton>
          )}
        </Box>
      </Box>
      {tabs}
    </Box>
  )
}
