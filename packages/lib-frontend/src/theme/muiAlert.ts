import { Components, Theme } from "@mui/material/styles"

import { accentScales } from "./accent-colors"
import { ThemeProps } from "./types"

// Radius and padding are estimates from Figma. Each severity uses the [50] fill and [100] border
// of its accent scale. The active (violet) variant is skipped: MUI Alert has no active severity.
const severityStyle = (scale: Record<number, string>) => ({
  backgroundColor: scale[50],
  border: `1px solid ${scale[100]}`,
})

// Dark mode uses the 900 and 800 steps of each scale, so the light text stays readable.
const darkSeverityStyle = (scale: Record<number, string>) => ({
  backgroundColor: scale[900],
  border: `1px solid ${scale[800]}`,
})

// The darkMode argument is accepted for the existing call site in themeOptions.ts. The light
// tints apply in light mode, and dark tints apply in dark mode.
export const muiAlert = (_props: ThemeProps): Components<Omit<Theme, "components">>["MuiAlert"] => {
  return {
    variants: [
      { props: { severity: "info" }, style: ({ theme }) => theme.palette.mode === "dark" ? darkSeverityStyle(accentScales.blue) : severityStyle(accentScales.blue) },
      { props: { severity: "success" }, style: ({ theme }) => theme.palette.mode === "dark" ? darkSeverityStyle(accentScales.green) : severityStyle(accentScales.green) },
      { props: { severity: "warning" }, style: ({ theme }) => theme.palette.mode === "dark" ? darkSeverityStyle(accentScales.yellow) : severityStyle(accentScales.yellow) },
      { props: { severity: "error" }, style: ({ theme }) => theme.palette.mode === "dark" ? darkSeverityStyle(accentScales.red) : severityStyle(accentScales.red) },
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
