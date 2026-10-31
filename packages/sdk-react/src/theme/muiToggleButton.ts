import { Components, Theme } from "@mui/material/styles"

import { isDarkMode } from "./helpers/isDarkMode.js"

import { neutralAlpha } from "./colors.js"

// Figma toggleButton items (spec 2.13) are text buttons. Default (medium) is the Sm text button
// of the Floating group: 28 high, px 8, gap 4, radius 8. size="small" is the XS text button of
// the Outlined group: 20 high, px 4, gap 2, radius 6. Hover and selected fill a.05 / w.10.
export const muiToggleButton = (): Components<Omit<Theme, "components">>["MuiToggleButton"] => ({
  defaultProps: {
    disableRipple: true,
  },
  styleOverrides: {
    root: ({ theme, ownerState }) => {
      const fill = isDarkMode(theme) ? neutralAlpha.lighten[100] : neutralAlpha.darken[50]
      const xs = ownerState.size === "small"

      return {
        ...theme.typography.button,
        height: theme.spacing(xs ? 2.5 : 3.5),
        minHeight: theme.spacing(xs ? 2.5 : 3.5),
        borderRadius: theme.spacing(xs ? 0.75 : 1),
        padding: theme.spacing(0, xs ? 0.5 : 1),
        gap: theme.spacing(xs ? 0.25 : 0.5),
        border: "none",
        color: theme.palette.text.primary,
        "& svg": {
          width: theme.spacing(2),
          height: theme.spacing(2),
          flexShrink: 0,
        },
        "&:hover, &.Mui-selected, &.Mui-selected:hover": {
          backgroundColor: fill,
          color: theme.palette.text.primary,
        },
        "&.Mui-disabled": {
          border: "none",
          color: theme.palette.text.primary,
          opacity: theme.palette.opacity.disabled,
        },
      }
    },
  },
})
