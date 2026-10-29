import { Components, Theme } from "@mui/material/styles"

export const muiToggleButtonGroup = (): Components<
  Omit<Theme, "components">
>["MuiToggleButtonGroup"] => {
  return {
    styleOverrides: {
      root: {
        borderRadius: "8px",
      },
    },
  }
}
