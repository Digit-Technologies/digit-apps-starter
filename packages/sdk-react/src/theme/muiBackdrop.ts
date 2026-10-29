import { Components, Theme } from "@mui/material/styles"

import { neutralAlpha } from "./colors.js"

export const muiBackdrop = (): Components<
  Omit<Theme, "components">
>["MuiBackdrop"] => {
  return {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: neutralAlpha.darken[100],
        ...theme.applyStyles("dark", {
          backgroundColor: neutralAlpha.darken[500],
        }),
      }),
    },
  }
}
