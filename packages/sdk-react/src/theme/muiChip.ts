import { createElement } from "react"

import { Components, Theme } from "@mui/material/styles"

import { X } from "../icons.js"

import { accentScales } from "./accent-colors.js"
import { focusRing } from "./focus.js"
import { neutralAlpha } from "./colors.js"

// A Chip is the Figma Pill (10381:23564); StatusPill only picks its colour per record stage. MUI's Chip `color`
// picks the tone: accents fill with their [250] tint in light mode and [750] in dark, with primary
// text. The default colour (and primary/secondary) is the Figma gray pill, a.05 / w.15. Outlined
// chips get the a.20 / w.20 border only. The MUI roles tint like the palette colour they are set
// to in palette.ts.
const tintScales: Partial<Record<string, Record<number, string>>> = {
  ...accentScales,
  success: accentScales.green,
  warning: accentScales.amber,
  error: accentScales.red,
  info: accentScales.blue,
}

// Theme-spacing units, so chips grow ×1.25 below 600px like the Figma mobile pills.
// small = Figma pill "Size Sm" (16 tall), medium = "Size Md" (20 tall).
const chipSizeTokens = {
  small: { height: 2, px: 0.5, gap: 0.25, radius: 0.5, typography: "pillSm" },
  medium: { height: 2.5, px: 0.75, gap: 0.5, radius: 0.75, typography: "pillMd" },
} as const

export const muiChip = (): Components<Omit<Theme, "components">>["MuiChip"] => ({
  // The Figma pill's trailing x is the Lucide x, not MUI's filled cancel glyph.
  defaultProps: {
    deleteIcon: createElement(X),
  },
  styleOverrides: {
    root: ({ ownerState, theme }) => {
      const scale = tintScales[ownerState.color ?? "default"]
      const isDark = theme.palette.mode === "dark"
      const token = ownerState.size === "small" ? chipSizeTokens.small : chipSizeTokens.medium
      const fill = scale
        ? isDark
          ? scale[750]
          : scale[250]
        : isDark
          ? neutralAlpha.lighten[150]
          : neutralAlpha.darken[50]
      const outlined = ownerState.variant === "outlined"
      const icon = theme.spacing(1.5)

      return {
        ...theme.typography[token.typography],
        boxSizing: "border-box",
        gap: theme.spacing(token.gap),
        height: theme.spacing(token.height),
        minWidth: theme.spacing(token.height),
        padding: `0 ${theme.spacing(token.px)}`,
        borderRadius: theme.spacing(token.radius),
        color: theme.palette.text.primary,
        border: "1px solid transparent",
        backgroundColor: outlined ? "transparent" : fill,
        ...(outlined && { borderColor: theme.palette.border.extrastrong }),
        "& .MuiChip-label": { padding: 0 },
        // Figma pill icons are 12px; the gap replaces MUI's per-slot margins.
        "& .MuiChip-icon, & .MuiChip-avatar, & .MuiChip-deleteIcon": {
          margin: 0,
          width: icon,
          height: icon,
          fontSize: icon,
          flexShrink: 0,
        },
        "& .MuiChip-icon": { color: "inherit" },
        "& .MuiChip-avatar": { color: "inherit", fontSize: theme.spacing(0.75) },
        // Trailing x at the helper opacity, as in the Figma pill anatomy.
        "& .MuiChip-deleteIcon": {
          color: "inherit",
          opacity: theme.palette.opacity.helper,
          "&:hover, &:active": { color: "inherit", opacity: 1 },
        },
        // Figma pills have no hover state; clickable chips get a light overlay so they read as
        // interactive, and keep their tint instead of MUI's darker palette fill.
        "&.MuiChip-clickable:hover, &.MuiChip-deletable.Mui-focusVisible, &.MuiChip-clickable.Mui-focusVisible":
          {
            backgroundColor: outlined ? "transparent" : fill,
            backgroundImage: `linear-gradient(${isDark ? neutralAlpha.lighten[50] : neutralAlpha.darken[50]}, ${isDark ? neutralAlpha.lighten[50] : neutralAlpha.darken[50]})`,
          },
        "&.Mui-focusVisible": { boxShadow: focusRing(theme) },
      }
    },
  },
})
