import { Components, Theme } from "@mui/material/styles"

import { neutral, stone } from "./colors"
import { outer } from "./shadows"

export const muiTooltip = (): Components<
  Omit<Theme, "components">
>["MuiTooltip"] => {
  return {
    styleOverrides: {
      tooltip: ({ theme }) => ({
        backgroundColor: stone[800],
        border: `1px solid ${theme.palette.border.strong}`,
        borderRadius:
          typeof theme.shape.borderRadius === "number"
            ? theme.shape.borderRadius / 2
            : `calc(${theme.shape.borderRadius} / 2)`,
        boxShadow: outer.md,
        color: neutral.white,
        minHeight: theme.spacing(3.5),
        maxWidth: theme.spacing(28),
        display: "flex",
        flexDirection: "row",
        padding: theme.spacing(0.5, 1),
        alignItems: "center",
        justifyContent: "center",
        textAlign: "left",
        margin: `${theme.spacing(0.5)}!important`,
        userSelect: "none",
        // Copy font styling from overline
        fontSize: theme.typography.overline.fontSize,
        fontWeight: theme.typography.overline.fontWeight,
        letterSpacing: theme.typography.overline.letterSpacing,
        textTransform: theme.typography.overline.textTransform,
        fontFamily: theme.typography.fontFamily,
        fontStyle: theme.typography.overline.fontStyle,
        lineHeight: theme.typography.overline.lineHeight,
      }),
    },
  }
}
