import { Components, Theme, alpha } from "@mui/material/styles"

import { neutral } from "./colors"
import { defaultTransition } from "./transitions"

export const muiListItemButton = ({
  darkMode,
}: {
  darkMode: boolean
}): Components<Omit<Theme, "components">>["MuiListItemButton"] => {
  return {
    defaultProps: {
      disableRipple: true,
      disableTouchRipple: true,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius:
          typeof theme.shape.borderRadius === "number"
            ? theme.shape.borderRadius / 2
            : `calc(${theme.shape.borderRadius} / 2)`,
        padding: theme.spacing(0.5, 1),
        minWidth: theme.spacing(3),
        height: theme.spacing(3),
        whiteSpace: "nowrap",
        transition: defaultTransition(theme),
        background: "transparent",
        border: "1px solid transparent",
        boxShadow: "none",
        color: theme.palette.text.secondary,
        fontFamily: theme.typography.button.fontFamily,
        fontSize: theme.typography.button.fontSize,
        fontWeight: theme.typography.button.fontWeight,
        lineHeight: theme.typography.button.lineHeight,
        flexDirection: "row",
        gap: theme.spacing(1),
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

        "&:hover": {
          color: theme.palette.text.primary,
          background: darkMode
            ? alpha(neutral.white, 0.1)
            : alpha(neutral.black, 0.05),
        },

        "&:active, &.Mui-selected": {
          color: theme.palette.text.primary,
          background: darkMode
            ? alpha(neutral.white, 0.05)
            : alpha(neutral.black, 0.1),
        },
      }),
    },
  }
}
