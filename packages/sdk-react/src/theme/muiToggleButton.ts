import { Components, Theme } from "@mui/material/styles"

export const muiToggleButton = (): Components<
  Omit<Theme, "components">
>["MuiToggleButton"] => {
  return {
    styleOverrides: {
      root: {
        borderRadius: "8px",
      },
    },
  }
}
