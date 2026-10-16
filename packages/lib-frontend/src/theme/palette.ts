import { ThemeOptions } from "@mui/material/styles"

import { accentPalette } from "./accent-colors"
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
      secondary: darkMode ? stone[350] : stone[550], // Text that supports primary information
      tertiary: darkMode ? stone[550] : stone[350], // Text that's of optional importance
      disabled: darkMode ? stone[550] : stone[350],
    },
    background: {
      default: darkMode ? stone[900] : neutral.white,
      secondary: darkMode ? stone[900] : neutral[50],
      paper: darkMode ? stone[800] : neutral.white,
      surface: darkMode ? stone[900] : neutral[50],
    },
    ...accentPalette,
    // MUI's own grey scale would show up in components. Use the stone scale instead.
    grey: {
      50: stone[50],
      100: stone[100],
      200: stone[200],
      300: stone[300],
      400: stone[400],
      500: stone[500],
      600: stone[600],
      700: stone[700],
      800: stone[800],
      900: stone[900],
    },
    // All palette extensions beyond standard MUI colors should be added here
    ...extensions,
  }
}
