import { Components, Theme } from "@mui/material/styles"

import { neutralAlpha } from "./colors"

// Loading placeholders use the same radius and tint as the platform's skeletons.
export const muiSkeleton = (): Components<Omit<Theme, "components">>["MuiSkeleton"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: theme.spacing(1),
      backgroundColor: theme.palette.mode === "dark" ? neutralAlpha.lighten[50] : neutralAlpha.darken[25],
    }),
  },
})
