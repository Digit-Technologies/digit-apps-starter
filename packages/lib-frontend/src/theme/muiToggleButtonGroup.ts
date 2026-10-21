import { Components, Theme } from "@mui/material/styles"

import { blue, red } from "./colors"

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
        // The item look comes from MuiToggleButton. This only undoes MUI's joined-segment styling
        // (shared borders, -1px margins, square inner corners), including its three-class
        // disabled rules, so items float apart with their own radius.
        "&& .MuiToggleButtonGroup-grouped.MuiToggleButtonGroup-grouped": {
          border: "none",
          margin: 0,
          borderRadius: "8px",
        },
      },
    },
  }
}
