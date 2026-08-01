import { Components, Theme } from "@mui/material/styles"

import { neutral } from "./colors"

export const muiAppBar = ({
  darkMode,
}: {
  darkMode: boolean
}): Components<Omit<Theme, "components">>["MuiAppBar"] => {
  return {
    styleOverrides: {
      colorPrimary: {
        backgroundColor: darkMode ? neutral.black : neutral[900],
      },
    },
  }
}
