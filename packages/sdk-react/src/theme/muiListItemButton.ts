import { Components, Theme } from "@mui/material/styles"

import { menuItemBackgrounds } from "./muiMenuItem.js"
import { defaultTransition } from "./transitions.js"

// Figma nav item (listItemButton): 28 tall, py 4 px 8, radius 8, button/Sm text in the secondary
// colour, a 16px icon and a 4px gap. Hover and focus a.05 / w.10, pressed and selected a.10 / w.05.
export const muiListItemButton = (): Components<
  Omit<Theme, "components">
>["MuiListItemButton"] => {
  return {
    defaultProps: {
      disableRipple: true,
      disableTouchRipple: true,
    },
    styleOverrides: {
      root: ({ theme }) => {
        const bg = menuItemBackgrounds(theme)
        return {
          ...theme.typography.button,
          borderRadius: theme.spacing(1),
          padding: theme.spacing(0.5, 1),
          minWidth: theme.spacing(3),
          height: theme.spacing(3.5),
          whiteSpace: "nowrap",
          transition: defaultTransition(theme),
          background: "transparent",
          border: "1px solid transparent",
          boxShadow: "none",
          color: theme.palette.text.secondary,
          flexDirection: "row",
          gap: theme.spacing(0.5),
          alignItems: "center",

          "& .MuiListItemIcon-root": {
            minWidth: "unset",
            minHeight: "unset",
            width: theme.spacing(2),
            height: theme.spacing(2),
            alignItems: "center",
            justifyItems: "center",
            margin: 0,

            "& .MuiSvgIcon-root": {
              width: theme.spacing(2),
              height: theme.spacing(2),
              margin: 0,
              stroke: "currentColor",
            },
          },

          "&:hover, &.Mui-focusVisible": {
            color: theme.palette.text.primary,
            background: bg.hover,
          },

          // MUI tints a selected row with primary.main, and again on hover. Keep the pressed tone.
          "&:active, &.Mui-selected, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible": {
            color: theme.palette.text.primary,
            background: bg.pressed,
          },

          "&.Mui-disabled": {
            opacity: 1,
            color: theme.palette.text.tertiary,
          },
        }
      },
    },
  }
}
