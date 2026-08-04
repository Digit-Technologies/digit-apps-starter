import { Components, Theme } from "@mui/material/styles"

export const muiMenuItem = (): Components<
  Omit<Theme, "components">
>["MuiMenuItem"] => {
  return {
    styleOverrides: {
      root: {
        fontSize: "14px",
      },
    },
  }
}
