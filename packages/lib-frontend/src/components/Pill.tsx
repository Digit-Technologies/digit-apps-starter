import React, { ReactNode } from "react"

import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { Theme, useTheme } from "@mui/material/styles"

import { type AccentColorName, accentScales } from "../theme/accent-colors"
import { blue, neutralAlpha } from "../theme/colors"

export type PillColor = "outlined" | "gray" | AccentColorName
// Public size names are kept for existing callers. `sm` is the Figma xs pill and `md` is the Figma sm pill.
export type PillSize = "sm" | "md"

const sizeTokens = {
  sm: { height: 16, px: "4px", gap: "2px", radius: "4px", fontSize: "11px", lineHeight: "12px" },
  md: { height: 20, px: "6px", gap: "4px", radius: "6px", fontSize: "12px", lineHeight: "16px" },
} as const

// Generic statuses only. Each maps to the colour the platform uses for the same meaning.
// Keys are lowercase, with spaces and hyphens turned into underscores.
const statusColors: Readonly<Record<string, PillColor>> = {
  draft: "outlined",
  open: "blue",
  sent: "violet",
  shipped: "yellow",
  stopped: "red",
  rejected: "red",
  approved: "green",
  received: "green",
  closed: "gray",
  cancelled: "gray",
  archived: "gray",
  not_started: "blue",
  active: "blue",
  building: "blue",
  live: "green",
  pending: "yellow",
  in_progress: "yellow",
  blocked: "red",
  failed: "red",
  complete: "green",
  completed: "green",
  done: "green",
}

const normaliseStatus = (status: string): string =>
  status.trim().toLowerCase().replace(/[\s-]+/g, "_")

const sentenceCase = (status: string): string => {
  const text = status.replace(/[_-]+/g, " ").trim().toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Gray uses the neutral alpha overlay. Accents use the 250 tint in light mode and the 750 tint in dark mode.
const tint = (color: PillColor, theme: Theme): string => {
  const isDark = theme.palette.mode === "dark"
  if (color === "gray") {
    return isDark ? neutralAlpha.lighten[50] : neutralAlpha.darken[50]
  }
  const scale = accentScales[color as AccentColorName]
  return isDark ? scale[750] : scale[250]
}

export interface PillProps {
  /** A generic status word such as "in progress". Its colour comes from the shared status list. */
  status?: string
  /** A palette colour for a category, such as "sky". Wins over `status` when both are set. */
  color?: PillColor
  /** Overrides the label. Otherwise `status` is shown in sentence case. */
  label?: ReactNode
  icon?: ReactNode
  endAdornment?: ReactNode
  size?: PillSize
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
}

/**
 * A small pill for a status or a category. Pass `status` for the shared colour of a generic
 * status, or `color` for a category. Unknown statuses are outlined, as on the platform.
 */
export const Pill = ({
  status,
  color,
  label,
  icon,
  endAdornment,
  size = "md",
  onClick,
}: PillProps) => {
  const theme = useTheme()
  const resolved: PillColor | undefined =
    color ?? (status ? statusColors[normaliseStatus(status)] : undefined)
  const text = label ?? (status ? sentenceCase(status) : undefined)
  const token = size === "sm" ? sizeTokens.sm : sizeTokens.md
  const fill = resolved && resolved !== "outlined" ? resolved : undefined

  return (
    <Box
      data-testid="pill"
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event: React.KeyboardEvent<HTMLElement>) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onClick(event as unknown as React.MouseEvent<HTMLElement>)
              }
            }
          : undefined
      }
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: token.gap,
        width: "fit-content",
        flexShrink: 0,
        maxWidth: "100%",
        height: token.height,
        minWidth: token.height,
        px: token.px,
        borderRadius: token.radius,
        border: "1px solid",
        borderColor: fill ? "transparent" : theme.palette.border.extrastrong,
        backgroundColor: fill ? tint(fill, theme) : "transparent",
        color: theme.palette.text.primary,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        userSelect: "none",
        cursor: onClick ? "pointer" : undefined,
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.mode === "dark" ? blue[400] : blue[600]}`,
          outlineOffset: "2px",
        },
      }}
    >
      {icon}
      {text != null && text !== "" && (
        <Typography
          component="span"
          sx={{ fontSize: token.fontSize, lineHeight: token.lineHeight, fontWeight: 500 }}
        >
          {text}
        </Typography>
      )}
      {endAdornment}
    </Box>
  )
}
