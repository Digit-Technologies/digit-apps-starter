import { Components, Theme } from "@mui/material/styles"

import { outer } from "./shadows"

export const muiMenu = (): Components<Omit<Theme, "components">>["MuiMenu"] => {
  return {
    defaultProps: {
      // digit-web passes BackdropProps. MUI 9 removed that prop; slotProps.backdrop
      // is the same invisible menu backdrop.
      slotProps: {
        backdrop: {
          invisible: true,
        },
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
        borderRadius: "10px",
        boxShadow: outer.md,
      }),
      list: {
        padding: 4,
      },
    },
  }
}
