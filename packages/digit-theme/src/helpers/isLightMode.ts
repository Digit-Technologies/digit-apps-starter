import { type Theme } from "@mui/material/styles"

interface ThemeWithModeOnly {
  palette: { mode: Theme["palette"]["mode"] }
}

export const isLightMode = (theme: ThemeWithModeOnly): boolean => {
  return theme.palette.mode === "light"
}
