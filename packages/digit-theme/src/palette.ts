import { ThemeOptions } from "@mui/material/styles"

import { amber, blue, green, neutral, red, stone } from "./colors"
import { getThemeExtensions } from "./theme-extensions"

import { ThemeProps } from "./types"

export const palette = ({ darkMode }: ThemeProps): ThemeOptions["palette"] => {
  const extensions = getThemeExtensions(darkMode)

  return {
    mode: darkMode ? "dark" : "light",
    primary: {
      main: darkMode ? neutral.white : stone[900],
      light: darkMode ? stone[200] : stone[600],
      dark: darkMode ? stone[500] : stone[800],
      contrastText: darkMode ? neutral.black : neutral.white,
    },
    secondary: {
      main: darkMode ? stone[300] : stone[700],
      light: darkMode ? stone[200] : stone[600],
      dark: darkMode ? stone[400] : stone[800],
      contrastText: darkMode ? neutral.black : neutral.white,
    },
    error: {
      main: red[500],
      light: red[400],
      dark: red[600],
      contrastText: neutral.white,
    },
    warning: {
      main: amber[500],
      light: amber[400],
      dark: amber[600],
      contrastText: neutral.black,
    },
    info: {
      main: blue[500],
      light: blue[400],
      dark: blue[600],
      contrastText: darkMode ? neutral.white : neutral.black,
    },
    success: {
      main: green[500],
      light: green[400],
      dark: green[600],
      contrastText: darkMode ? neutral.white : neutral.black,
    },
    text: {
      primary: darkMode ? neutral.white : stone[950], // All-purpose body text
      secondary: darkMode ? stone[350] : stone[650], // Text that supports primary information
      tertiary: darkMode ? stone[550] : stone[450], // Text that's of optional importance
      disabled: darkMode ? stone[550] : stone[450],
    },
    background: {
      default: darkMode ? stone[900] : stone[100],
      paper: darkMode ? stone[800] : neutral.white,
      surface: darkMode ? stone[900] : neutral[50],
    },
    // All palette extensions beyond standard MUI colors should be added here
    ...extensions,
  }
}
