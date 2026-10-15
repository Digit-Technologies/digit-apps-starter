import { Components, Theme } from "@mui/material/styles"

import { blue } from "./colors"
import { ThemeProps } from "./types"

// Checked checkboxes use the same blue as switches and radios.
export const muiCheckbox = ({
  darkMode,
}: ThemeProps): Components<Omit<Theme, "components">>["MuiCheckbox"] => ({
  styleOverrides: {
    root: {
      "&.Mui-checked": {
        color: darkMode ? blue[400] : blue[500],
      },
      "&.Mui-checked:hover": {
        backgroundColor: darkMode ? blue[900] : blue[50],
      },
    },
  },
})
