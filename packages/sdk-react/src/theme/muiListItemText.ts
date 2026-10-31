import { Components, Theme } from "@mui/material/styles"

// The primary line takes the row's type: button/Sm 13/16 500 in a MenuItem or ListItemButton,
// body1 elsewhere. The secondary line is the Figma item subtitle: overline 11/12, secondary
// colour at the 60% helper opacity.
export const muiListItemText = (): Components<
  Omit<Theme, "components">
>["MuiListItemText"] => ({
  styleOverrides: {
    root: {
      margin: 0,
      minWidth: 0,
      "&.MuiListItemText-multiline": {
        margin: 0,
      },
    },
    primary: {
      fontSize: "inherit",
      lineHeight: "inherit",
      fontWeight: "inherit",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    secondary: ({ theme }) => ({
      ...theme.typography.overline,
      color: theme.palette.text.secondary,
      opacity: theme.palette.opacity.helper,
      marginTop: theme.spacing(0.5),
    }),
  },
})
