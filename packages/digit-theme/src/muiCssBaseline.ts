import darkScrollbar from "@mui/material/darkScrollbar"
import { Components, Theme } from "@mui/material/styles"

import { neutralAlpha } from "./colors"
import { ThemeProps } from "./types"

export const muiCssBaseline = ({
  darkMode,
}: ThemeProps): Components<Omit<Theme, "components">>["MuiCssBaseline"] => ({
  styleOverrides: () => ({
    html: {
      // Set explicit base font size for consistent rem calculations
      fontSize: "16px", // 1rem = 16px
      ...darkScrollbar(
        darkMode
          ? {
              track: "transparent",
              thumb: neutralAlpha.darken[600],
              active: neutralAlpha.darken[500],
            }
          : {
              track: "transparent",
              thumb: neutralAlpha.darken[400],
              active: neutralAlpha.darken[500],
            },
      ),
      // scrollbarWidth for Firefox
      scrollbarWidth: "thin",
    },
    body: {
      // Enable Inter font OpenType features
      fontFeatureSettings: '"cv06" 1, "dlig" 1, "ss03" 1, "tnum" 1, "zero" 1',
      fontVariantNumeric: "tabular-nums",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
      textRendering: "auto",
      // Text selection colors
      "&::selection": {
        backgroundColor: darkMode
          ? neutralAlpha.lighten[200]
          : neutralAlpha.darken[100],
      },
      "&::-moz-selection": {
        backgroundColor: darkMode
          ? neutralAlpha.lighten[200]
          : neutralAlpha.darken[100],
      },
    },
  }),
})
