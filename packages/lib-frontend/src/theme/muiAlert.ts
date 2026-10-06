import { Components, Theme } from "@mui/material/styles"

import { yellow } from "./colors"
import { ThemeProps } from "./types"

// Warning colors match digit-web. The web defaultProps.iconMapping renders
// IconWrapper and is omitted here (that component is not in this package).
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
