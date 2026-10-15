import { Components, Theme } from "@mui/material/styles"

import { isDarkMode } from "./helpers/isDarkMode"

import { neutralAlpha } from "./colors"

export const muiToggleButton = (): Components<
  Omit<Theme, "components">
>["MuiToggleButton"] => {
  return {
    styleOverrides: {
      // Floating item: the small text button look, with no border.
      root: ({ theme }) => {
        const fill = isDarkMode(theme)
          ? neutralAlpha.lighten[50]
          : neutralAlpha.darken[50]

        return {
          height: "28px",
          minHeight: "28px",
          borderRadius: "8px",
          border: "none",
          padding: "0 8px",
          gap: "4px",
          fontSize: "13px",
          color: theme.palette.text.primary,
          "&:hover, &.Mui-selected, &.Mui-selected:hover": {
            backgroundColor: fill,
            color: theme.palette.text.primary,
          },
        }
      },
    },
  }
}
