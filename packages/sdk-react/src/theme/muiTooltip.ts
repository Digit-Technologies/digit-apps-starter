import { Components, Theme } from "@mui/material/styles"

import { neutral, neutralAlpha, stone } from "./colors.js"
import { outer } from "./shadows.js"

// Figma Tooltip (10060:222467): the same dark surface in both modes (tooltip/background #292524,
// tooltip/border w.10, white text), padding 8, radius 8, outer/md, overline 11/12 text, 28px min
// height and tooltip/width/max 256.
export const muiTooltip = (): Components<Omit<Theme, "components">>["MuiTooltip"] => {
  return {
    styleOverrides: {
      tooltip: ({ theme }) => ({
        ...theme.typography.overline,
        backgroundColor: stone[800],
        border: `1px solid ${neutralAlpha.lighten[100]}`,
        borderRadius: theme.spacing(1),
        boxShadow: outer.md,
        color: neutral.white,
        minHeight: theme.spacing(3.5),
        maxWidth: theme.spacing(32),
        display: "flex",
        flexDirection: "row",
        padding: theme.spacing(1),
        alignItems: "center",
        justifyContent: "center",
        textAlign: "left",
        userSelect: "none",
        // A 4px gap from the anchor. MUI sets 14px (24px on touch) per placement with this same
        // selector, and theme overrides come after it.
        ".MuiTooltip-popper[data-popper-placement] &": {
          margin: theme.spacing(0.5),
        },
      }),
    },
  }
}
