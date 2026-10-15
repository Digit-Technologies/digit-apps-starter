import React, { ReactNode } from "react"

import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { Theme, useTheme } from "@mui/material/styles"

import { type AccentColorName, accentScales } from "../theme/accent-colors"

export type PillColor = "outlined" | "gray" | AccentColorName
export type PillSize = "sm" | "md"

// Generic statuses only. Each maps to the colour the platform uses for the same meaning.
// Keys are lowercase, with spaces and hyphens turned into underscores.
const statusColors: Readonly<Record<string, PillColor>> = {
  draft: "gray",
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

// Light mode uses the 250 tint and dark mode the 750 tint, as the platform's pills do.
const tint = (color: PillColor, theme: Theme): string => {
  const isDark = theme.palette.mode === "dark"
  const scale = color === "gray" ? accentScales.stone : accentScales[color as AccentColorName]
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
  const isSmall = size === "sm"

  return (
    <Box
      data-testid="pill"
      role={onClick ? "button" : undefined}
      onClick={onClick}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.5,
        width: "fit-content",
        flexShrink: 0,
        maxWidth: "100%",
        height: isSmall ? 16 : 20,
        minWidth: isSmall ? 16 : 20,
        px: isSmall ? 0.25 : 0.5,
        borderRadius: "6px",
        border: "1px solid",
        borderColor: resolved && resolved !== "outlined" ? "transparent" : theme.palette.border.extrastrong,
        backgroundColor: resolved && resolved !== "outlined" ? tint(resolved, theme) : "transparent",
        color: theme.palette.text.primary,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        userSelect: "none",
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      {icon}
      {text != null && text !== "" && (
        <Typography
          component="span"
          sx={{ fontSize: isSmall ? "11px" : "12px", lineHeight: isSmall ? "16px" : "20px", fontWeight: 500 }}
        >
          {text}
        </Typography>
      )}
      {endAdornment}
    </Box>
  )
}
