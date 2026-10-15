import { Components, Theme } from "@mui/material/styles"

import { isDarkMode } from "./helpers/isDarkMode"

import { blue, neutralAlpha, red } from "./colors"

// Floating is the default group look: no track, with items that fill on hover and selection.
// For an outlined track, pass sx={{ bgcolor, p: 0.5, borderRadius: "8px" }} at the call site.
export const muiToggleButtonGroup = (): Components<
  Omit<Theme, "components">
>["MuiToggleButtonGroup"] => {
  return {
    styleOverrides: {
      root: {
        gap: "4px",
        border: "1px solid transparent",
        borderRadius: "8px",
        // Keyboard focus draws a 1px blue border on the group.
        "&:has(.Mui-focusVisible)": {
          borderColor: blue[600],
        },
        "&[aria-invalid='true'], &.Mui-error": {
          borderColor: red[500],
        },
      },
      // MUI emits this slot after its firstButton, middleButton and lastButton rules, so it wins at equal specificity.
      grouped: ({ theme }) => {
        const dark = isDarkMode(theme)
        const fill = dark ? neutralAlpha.lighten[50] : neutralAlpha.darken[50]

        return {
          height: "28px",
          minHeight: "28px",
          borderRadius: "8px",
          border: "none",
          margin: 0,
          padding: "0 8px",
          gap: "4px",
          fontSize: "13px",
          color: theme.palette.text.primary,
          backgroundColor: "transparent",
          "&:hover, &.Mui-selected": {
            backgroundColor: fill,
          },
        }
      },
    },
  }
}
