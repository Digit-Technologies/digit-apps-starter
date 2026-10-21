import { Components, Theme } from "@mui/material/styles"

import { outer } from "./shadows"

// A free-form popover (a filter panel, a picker) gets the menu surface: paper with the solid
// strong border and outer/md, so it reads in dark mode where paper matches the page. Radius 12
// is Figma paper/border-radius/sm. MuiMenu restyles its own paper on top of this (radius 10).
export const muiPopover = (): Components<Omit<Theme, "components">>["MuiPopover"] => ({
  styleOverrides: {
    paper: ({ theme }) => ({
      backgroundColor: theme.palette.background.paper,
      backgroundImage: "none",
      border: `1px solid ${theme.palette.border.solidStrong}`,
      borderRadius: theme.spacing(1.5),
      boxShadow: outer.md,
    }),
  },
})
