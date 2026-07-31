import { Components, Theme } from "@mui/material/styles"

import { outer } from "./shadows"

export const muiMenu = (): Components<Omit<Theme, "components">>["MuiMenu"] => {
  return {
    defaultProps: {
      BackdropProps: {
        invisible: true,
      },
    },
    styleOverrides: {
      root: {
        "& .MuiBackdrop-root": {
          backgroundColor: "transparent",
        },
      },
      paper: ({ theme }) => ({
        border: `1px solid ${theme.palette.border.strong}`,
        borderRadius:
          typeof theme.shape.borderRadius === "number"
            ? theme.shape.borderRadius / 2
            : `calc(${theme.shape.borderRadius} / 2)`,
        boxShadow: outer.sm,
      }),
      list: {
        padding: 0,
      },
    },
  }
}
