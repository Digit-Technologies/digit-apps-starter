import { Components, Theme } from "@mui/material/styles"

import { isDarkMode } from "./helpers/isDarkMode"

import { blue, neutralAlpha, red } from "./colors"

export const muiToggleButtonGroup = (): Components<
  Omit<Theme, "components">
>["MuiToggleButtonGroup"] => {
  return {
    styleOverrides: {
      // Outlined group: a tinted track that holds xs text-button items.
      root: ({ theme }) => {
        const dark = isDarkMode(theme)
        const track = dark ? neutralAlpha.lighten[50] : neutralAlpha.darken[50]
        const itemSelected = dark
          ? neutralAlpha.lighten[100]
          : neutralAlpha.darken[100]

        return {
          borderRadius: "8px",
          backgroundColor: track,
          // Transparent border keeps layout still when the error border appears.
          border: "1px solid transparent",
          gap: 0,
          // Triple & outranks MUI's grouped-child rules, which otherwise add borders and negative margins.
          "&&& .MuiToggleButton-root": {
            borderRadius: "6px",
            border: "none",
            margin: 0,
            padding: "0 4px",
            gap: "2px",
            height: "20px",
            minHeight: "20px",
            fontSize: "13px",
            color: theme.palette.text.primary,
            backgroundColor: "transparent",
          },
          "&&& .MuiToggleButton-root:hover": {
            backgroundColor: track,
          },
          "&&& .MuiToggleButton-root.Mui-selected, &&& .MuiToggleButton-root.Mui-selected:hover": {
            backgroundColor: itemSelected,
          },
          // Keyboard focus draws the outline on the group, not the item.
          "&:has(.Mui-focusVisible)": {
            outline: `2px solid ${blue[600]}`,
            outlineOffset: "2px",
          },
          "&[aria-invalid='true'], &.Mui-error": {
            border: `1px solid ${red[500]}`,
          },
        }
      },
    },
  }
}
