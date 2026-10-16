import { Components, Theme } from "@mui/material/styles"

import { accentScales } from "./accent-colors"

// MUI's Chip `color` picks the tone. Filled chips get a light tint of that colour's scale
// (200 in light mode, 750 in dark), with primary text. Outlined chips get a border only.
// Any accent colour works, and the default colour is stone, the neutral grey.
// The MUI roles tint like the palette colour they are set to in palette.ts.
const tintScales: Partial<Record<string, Record<number, string>>> = {
  ...accentScales,
  default: accentScales.stone,
  success: accentScales.green,
  warning: accentScales.amber,
  error: accentScales.red,
  info: accentScales.blue,
}

// Repeats the token values in components/Pill.tsx. muiChip.ts must not import Pill (circular risk).
const chipSizeTokens = {
  small: { height: "16px", px: "4px", radius: "4px", fontSize: "11px", lineHeight: "12px" },
  medium: { height: "20px", px: "6px", radius: "6px", fontSize: "12px", lineHeight: "16px" },
} as const

export const muiChip = (): Components<Omit<Theme, "components">>["MuiChip"] => ({
  styleOverrides: {
    root: ({ ownerState, theme }) => {
      const scale = tintScales[ownerState.color ?? "default"] ?? accentScales.stone
      const isDark = theme.palette.mode === "dark"
      const token = ownerState.size === "small" ? chipSizeTokens.small : chipSizeTokens.medium

      return {
        borderRadius: token.radius,
        fontSize: token.fontSize,
        fontWeight: 500,
        height: token.height,
        lineHeight: token.lineHeight,
        color: theme.palette.text.primary,
        border: "1px solid transparent",
        ...(ownerState.variant === "outlined"
          ? {
              backgroundColor: "transparent",
              borderColor: theme.palette.border.extrastrong,
            }
          : {
              backgroundColor: isDark ? scale[750] : scale[200],
            }),
        "& .MuiChip-label": {
          paddingLeft: token.px,
          paddingRight: token.px,
        },
        "& .MuiChip-icon": {
          color: "inherit",
          marginLeft: theme.spacing(0.5),
          marginRight: theme.spacing(-0.25),
        },
      }
    },
  },
})
