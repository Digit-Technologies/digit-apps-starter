import { Components, Theme } from "@mui/material/styles"

// Figma Menu section header and Settings navbar heading: overline 11/12 in the secondary colour,
// px 8, 16 tall. MUI's default is a 48px row at 14px.
export const muiListSubheader = (): Components<
  Omit<Theme, "components">
>["MuiListSubheader"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      ...theme.typography.overline,
      display: "flex",
      alignItems: "center",
      minHeight: theme.spacing(2),
      color: theme.palette.text.secondary,
      backgroundColor: "transparent",
      // Not sticky: the 4px list gap already separates groups, and a sticky header would need
      // an opaque fill that hides the menu's padding.
      position: "static",
    }),
    gutters: ({ theme }) => ({
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1),
    }),
  },
})
