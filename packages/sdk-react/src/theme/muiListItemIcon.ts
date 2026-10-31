import { Components, Theme } from "@mui/material/styles"

// Figma menu and nav items: a 16px icon in the text colour. The parent row supplies the 4px gap,
// so the icon reserves no width of its own (MUI reserves 56, or 36 in a MenuItem).
export const muiListItemIcon = (): Components<
  Omit<Theme, "components">
>["MuiListItemIcon"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      minWidth: 0,
      flexShrink: 0,
      color: "inherit",
      alignItems: "center",
      justifyContent: "center",
      // The 16px line box, so the icon centres on the label's first line.
      height: theme.spacing(2),
      "& svg": {
        width: theme.spacing(2),
        height: theme.spacing(2),
      },
    }),
  },
})
