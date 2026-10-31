import { Components, Theme } from "@mui/material/styles"

import { neutralAlpha } from "./colors.js"
import { focusColor } from "./focus.js"
import { isDarkMode } from "./helpers/isDarkMode.js"

// Figma toggleButton groups (spec 2.13), picked with `size`:
// - default (medium): Floating. No track; items are Sm text buttons that fill on hover and selection.
// - size="small": Outlined. A grey track (a.05 / w.15) with 4px padding around XS items. Use it for
//   a compact segmented filter such as All / Active / Archived.
// Both draw a 1px line round the group for keyboard focus (focusColor) and for error (error.main).
export const muiToggleButtonGroup = (): Components<
  Omit<Theme, "components">
>["MuiToggleButtonGroup"] => ({
  styleOverrides: {
    root: ({ theme, ownerState }) => {
      const outlined = ownerState.size === "small"
      return {
        gap: theme.spacing(0.5),
        // Figma strokes sit inside the frame, so an inset outline keeps the group at item height.
        outline: "1px solid transparent",
        outlineOffset: "-1px",
        borderRadius: theme.spacing(1),
        ...(outlined && {
          padding: theme.spacing(0.5),
          backgroundColor: isDarkMode(theme) ? neutralAlpha.lighten[150] : neutralAlpha.darken[50],
        }),
        "&:has(.Mui-focusVisible)": {
          outlineColor: focusColor(theme),
        },
        "&[aria-invalid='true'], &.Mui-error": {
          outlineColor: theme.palette.error.main,
        },
        // The item look comes from MuiToggleButton. This only undoes MUI's joined-segment styling
        // (shared borders, -1px margins, square inner corners), including its three-class
        // disabled rules, so items float apart with their own radius.
        "&& .MuiToggleButtonGroup-grouped.MuiToggleButtonGroup-grouped": {
          border: "none",
          margin: 0,
          borderRadius: theme.spacing(outlined ? 0.75 : 1),
        },
      }
    },
  },
})
