import { Components, Theme } from "@mui/material/styles"

import { yellow } from "./colors"
import { ThemeProps } from "./types"

export const muiAlert = ({
  darkMode,
}: ThemeProps): Components<Omit<Theme, "components">>["MuiAlert"] => {
  return {
    styleOverrides: {
      root: {
        severity: {
          warning: {
            root: {
              color: darkMode ? yellow[100] : yellow[800],
              backgroundColor: darkMode ? yellow[800] : yellow[200],
            },
          },
        },
      },
    },
  }
}
