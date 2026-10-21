import darkScrollbar from "@mui/material/darkScrollbar"
import { Components, Theme } from "@mui/material/styles"

import { blue, neutralAlpha } from "./colors"
import { ThemeProps } from "./types"

// Shared html/body rules match digit-web. Omitted on purpose: Clerk's
// `.cl-organizationSwitcher-root` overrides and detail-inset form styles
// (those need private web components).
export const muiCssBaseline = ({
  darkMode,
}: ThemeProps): Components<Omit<Theme, "components">>["MuiCssBaseline"] => ({
  styleOverrides: () => ({
    // Figma Scale: an 8px spacing base, and 10px below 600px. theme.spacing() reads it.
    ":root": {
      "--digit-spacing-base": "8px",
      "@media (max-width: 599px) and not print": {
        "--digit-spacing-base": "10px",
      },
    },
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
      // The Inter features every Figma text style sets: slashed zero, the ss07 and ss08 sets,
      // the cv06 alternate, and lining tabular figures.
      fontFeatureSettings: '"zero" 1, "ss07" 1, "ss08" 1, "cv06" 1, "lnum" 1, "tnum" 1',
      fontVariantNumeric: "tabular-nums",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
      textRendering: "auto",
      // Text selection colors
      // Figma text selection highlight: the blue pill tint.
      "& ::selection": {
        backgroundColor: darkMode ? blue[750] : blue[250],
      },
    },
  }),
})
