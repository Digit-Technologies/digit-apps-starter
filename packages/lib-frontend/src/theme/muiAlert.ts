import { Components, Theme } from "@mui/material/styles"

import { accentScales } from "./accent-colors"
import { ThemeProps } from "./types"

// The standard Alert is the native tinted banner: each severity uses the [50] fill and [100]
// border of its accent scale in light mode, and the [900] fill and [800] border in dark mode.
// The filled and outlined variants keep MUI's look, so they stay distinct.
const severityStyle = (scale: Record<number, string>) => ({ theme }: { theme: Theme }) => ({
  backgroundColor: scale[50],
  border: `1px solid ${scale[100]}`,
  color: theme.palette.text.primary,
  ...theme.applyStyles("dark", {
    backgroundColor: scale[900],
    border: `1px solid ${scale[800]}`,
  }),
})

export const muiAlert = (_props: ThemeProps): Components<Omit<Theme, "components">>["MuiAlert"] => ({
  variants: [
    { props: { variant: "standard", severity: "info" }, style: severityStyle(accentScales.blue) },
    { props: { variant: "standard", severity: "success" }, style: severityStyle(accentScales.green) },
    { props: { variant: "standard", severity: "warning" }, style: severityStyle(accentScales.yellow) },
    { props: { variant: "standard", severity: "error" }, style: severityStyle(accentScales.red) },
  ],
  styleOverrides: {
    root: {
      borderRadius: "12px",
      padding: "8px",
      fontSize: "13px",
      lineHeight: "16px",
    },
  },
})
