import { Components, Theme } from "@mui/material/styles"

// Figma surfaces are flat colours in both modes. MUI lightens elevated Paper in dark mode with a
// white gradient overlay (dialogs, menus, popovers, drawers), which no Figma frame has, so it is
// removed. Outlined Paper uses the 10% strong border (paper/border/alpha/strong).
export const muiPaper = (): Components<Omit<Theme, "components">>["MuiPaper"] => ({
  styleOverrides: {
    root: {
      backgroundImage: "none",
    },
    outlined: ({ theme }) => ({
      borderColor: theme.palette.border.strong,
    }),
  },
})
