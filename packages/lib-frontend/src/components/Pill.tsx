import React, { ReactNode } from "react"

import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { Theme, useTheme } from "@mui/material/styles"

import { type AccentColorName, accentScales } from "../theme/accent-colors"
import { neutralAlpha } from "../theme/colors"
import { focusRing } from "../theme/focus"

export type PillColor = "outlined" | "gray" | AccentColorName
// Public size names are kept for existing callers. `sm` is the Figma xs pill and `md` is the Figma sm pill.
export type PillSize = "sm" | "md"

// Figma pill tokens in theme-spacing units, so a pill grows ×1.25 below 600px (16→20, 20→25),
// as the Figma mobile pills do. The text styles carry the same mobile step.
const sizeTokens = {
  sm: { height: 2, px: 0.5, gap: 0.25, radius: 0.5, typography: "pillSm" },
  md: { height: 2.5, px: 0.75, gap: 0.5, radius: 0.75, typography: "pillMd" },
} as const

// Generic statuses only. Each maps to the colour the platform uses for the same meaning.
// Keys are lowercase, with spaces and hyphens turned into underscores.
const statusColors: Readonly<Record<string, PillColor>> = {
  draft: "outlined",
  open: "blue",
  ready: "orange",
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
  queued: "yellow",
  waiting: "yellow",
  in_progress: "yellow",
  running: "blue",
  scheduled: "blue",
  paused: "gray",
  blocked: "red",
  failed: "red",
  complete: "green",
  completed: "green",
  done: "green",
  succeeded: "green",
  success: "green",
}

const normaliseStatus = (status: string): string =>
  status.trim().toLowerCase().replace(/[\s-]+/g, "_")

const sentenceCase = (status: string): string => {
  const text = status.replace(/[_-]+/g, " ").trim().toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Gray is Figma pill/background/gray, a.05 in light mode and w.15 in dark. Accents use the 250 tint in light mode and the 750 tint in dark mode.
const tint = (color: PillColor, theme: Theme): string => {
  const isDark = theme.palette.mode === "dark"
  if (color === "gray") {
    return isDark ? neutralAlpha.lighten[150] : neutralAlpha.darken[50]
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
        boxSizing: "border-box",
        height: theme.spacing(token.height),
        minWidth: theme.spacing(token.height),
        px: token.px,
        borderRadius: theme.spacing(token.radius),
        border: "1px solid",
        borderColor: fill ? "transparent" : theme.palette.border.extrastrong,
        backgroundColor: fill ? tint(fill, theme) : "transparent",
        color: theme.palette.text.primary,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        userSelect: "none",
        cursor: onClick ? "pointer" : undefined,
        // Figma pill icons (lead, trail, chevron, x) are all 12px.
        "& svg": {
          width: theme.spacing(1.5),
          height: theme.spacing(1.5),
          flexShrink: 0,
        },
        "&:focus-visible": {
          outline: "none",
          boxShadow: focusRing(theme),
        },
      }}
    >
      {icon}
      {text != null && text !== "" && (
        <Typography
          component="span"
          variant={token.typography}
          sx={{
            color: "inherit",
            overflow: "hidden",
            textOverflow: "ellipsis",
            // An icon inside the label (e.g. `label={<>Default <Info size={12} /></>}`) sits on the text.
            "& svg": { verticalAlign: "-0.125em" },
          }}
        >
          {text}
        </Typography>
      )}
      {endAdornment}
    </Box>
  )
}
