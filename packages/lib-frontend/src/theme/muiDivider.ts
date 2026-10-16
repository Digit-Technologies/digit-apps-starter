import { Components, Theme } from "@mui/material/styles"

import { neutral } from "./colors"

export const muiDivider = (): Components<
  Omit<Theme, "components">
>["MuiDivider"] => {
  return {
    styleOverrides: {
      root: ({ theme }) => ({
        ...(theme.palette.mode === "light" && {
          borderColor: neutral[200],
        }),
        ...theme.applyStyles("dark", {
          borderColor: neutral[800],
        }),
      }),
    },
  }
}
