import { Components, Theme } from "@mui/material/styles"

import { accentScales } from "./accent-colors"

// MUI's Chip `color` picks the tone. Filled chips get a light tint of that colour's scale
// (250 in light mode, 750 in dark), with primary text. Outlined chips get a border only.
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

export const muiChip = (): Components<Omit<Theme, "components">>["MuiChip"] => ({
  styleOverrides: {
    root: ({ ownerState, theme }) => {
      const scale = tintScales[ownerState.color ?? "default"] ?? accentScales.stone
      const isDark = theme.palette.mode === "dark"

      return {
        borderRadius: theme.spacing(0.75), // 6px
        fontSize: "12px",
        fontWeight: 500,
        height: "20px",
        lineHeight: "20px",
        color: theme.palette.text.primary,
        border: "1px solid transparent",
        ...(ownerState.variant === "outlined"
          ? {
              backgroundColor: "transparent",
              borderColor: theme.palette.border.extrastrong,
            }
          : {
              backgroundColor: isDark ? scale[750] : scale[250],
            }),
        "& .MuiChip-label": {
          paddingLeft: theme.spacing(0.5),
          paddingRight: theme.spacing(0.5),
        },
        "& .MuiChip-icon": {
          color: "inherit",
          marginLeft: theme.spacing(0.5),
          marginRight: -theme.spacing(0.25),
        },
      }
    },
  },
})
