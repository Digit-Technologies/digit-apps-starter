import { Components, Theme } from "@mui/material/styles"

import { neutralAlpha } from "./colors"
import { outer } from "./shadows"

export const muiSnackbarContent = (): Components<
  Omit<Theme, "components">
>["MuiSnackbarContent"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${neutralAlpha.darken[100]}`,
      borderRadius: "12px",
      padding: "8px",
      gap: "8px",
      boxShadow: outer.md,
      fontSize: "13px",
      lineHeight: "16px",
      color: theme.palette.text.primary,
    }),
  },
})
