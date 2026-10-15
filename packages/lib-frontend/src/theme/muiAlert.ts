import { Components, Theme } from "@mui/material/styles"

import { accentScales } from "./accent-colors"
import { ThemeProps } from "./types"

// Radius and padding are estimates from Figma. Each severity uses the [50] fill and [100] border
// of its accent scale. The active (violet) variant is skipped: MUI Alert has no active severity.
const severityStyle = (scale: Record<number, string>) => ({
  backgroundColor: scale[50],
  border: `1px solid ${scale[100]}`,
})

// The darkMode argument is accepted for the existing call site in themeOptions.ts. The fills are
// light tints in both modes, per the Figma spec.
export const muiAlert = (_props: ThemeProps): Components<Omit<Theme, "components">>["MuiAlert"] => {
  return {
    variants: [
      { props: { severity: "info" }, style: severityStyle(accentScales.blue) },
      { props: { severity: "success" }, style: severityStyle(accentScales.green) },
      { props: { severity: "warning" }, style: severityStyle(accentScales.yellow) },
      { props: { severity: "error" }, style: severityStyle(accentScales.red) },
    ],
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: "12px",
        padding: "8px",
        fontSize: "13px",
        lineHeight: "16px",
        color: theme.palette.text.primary,
      }),
    },
  }
}
