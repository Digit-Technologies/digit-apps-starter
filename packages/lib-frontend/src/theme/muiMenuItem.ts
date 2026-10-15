import { Components, Theme } from "@mui/material/styles"

export const muiMenuItem = (): Components<
  Omit<Theme, "components">
>["MuiMenuItem"] => {
  return {
    styleOverrides: {
      root: {
        fontSize: "13px",
        minHeight: 28,
        padding: "4px 8px",
        margin: "0 0 2px",
        borderRadius: "6px",
      },
    },
  }
}
