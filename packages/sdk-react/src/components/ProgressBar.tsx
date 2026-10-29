import React from "react"

import Box from "@mui/material/Box"
import LinearProgress from "@mui/material/LinearProgress"
import Typography from "@mui/material/Typography"
import { SxProps, Theme } from "@mui/material/styles"

import { ArrowUp } from "../icons.js"

import { orange } from "../theme/colors.js"

export interface ProgressBarProps {
  /** The amount used or done so far. */
  value: number
  /** The limit or target. The bar is full at this value. */
  total: number
  /** A unit after the total, such as "kg". */
  unit?: string
  /** Formats `value` and `total`. Defaults to two decimals with grouping, e.g. "1,200.00". */
  format?: (n: number) => string
  /** Names the bar for screen readers. Defaults to the caption text. */
  "aria-label"?: string
  sx?: SxProps<Theme>
}

const defaultFormat = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/**
 * Figma LinearProgress/Set (10060:222405): the 8px emerald bar with a right-aligned overline
 * caption 4 below it, "value / total unit" with a 2 gap. At zero the caption is tertiary. In
 * progress, the numbers and unit are primary and only "/" is secondary. Over the limit, an
 * arrow-up 12 and the value turn orange (foreground/orange/primary) and the rest is secondary.
 * For a bar with no caption, use the themed MUI `LinearProgress` directly.
 */
export const ProgressBar = ({
  value,
  total,
  unit,
  format = defaultFormat,
  "aria-label": ariaLabel,
  sx,
}: ProgressBarProps) => {
  const over = value > total
  const empty = value <= 0
  const percent = total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : over ? 100 : 0
  const caption = `${format(value)} / ${format(total)}${unit ? ` ${unit}` : ""}`

  const valueColor = empty ? "text.tertiary" : over ? undefined : "text.primary"
  const restColor = empty ? "text.tertiary" : over ? "text.secondary" : "text.primary"
  const slashColor = empty ? "text.tertiary" : "text.secondary"

  return (
    <Box sx={[{ display: "flex", flexDirection: "column", gap: 0.5 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <LinearProgress variant="determinate" value={percent} aria-label={ariaLabel ?? caption} />
      <Typography
          variant="overline"
          component="div"
          aria-hidden
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 0.25,
            whiteSpace: "nowrap",
          }}
        >
          {over && (
            <Box
              component={ArrowUp}
              aria-hidden
              sx={(theme) => ({
                width: theme.spacing(1.5),
                height: theme.spacing(1.5),
                flexShrink: 0,
                color: orange[550],
                ...theme.applyStyles("dark", { color: orange[450] }),
              })}
            />
          )}
          <Box
            component="span"
            sx={
              over
                ? (theme) => ({ color: orange[550], ...theme.applyStyles("dark", { color: orange[450] }) })
                : { color: valueColor }
            }
          >
            {format(value)}
          </Box>
          <Box component="span" sx={{ color: slashColor }}>
            /
          </Box>
          <Box component="span" sx={{ color: restColor }}>
            {format(total)}
          </Box>
          {unit && (
            <Box component="span" sx={{ color: restColor }}>
              {unit}
            </Box>
          )}
      </Typography>
    </Box>
  )
}
