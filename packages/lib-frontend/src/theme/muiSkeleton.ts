import { Components, Theme } from "@mui/material/styles"

import { neutralAlpha } from "./colors"

// Figma Skeleton (12426:25443): radius 8, fill paper/background/alpha/primary (a.03 / w.03).
export const muiSkeleton = (): Components<Omit<Theme, "components">>["MuiSkeleton"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: theme.spacing(1),
      backgroundColor: neutralAlpha.darken[25],
      ...theme.applyStyles("dark", {
        backgroundColor: neutralAlpha.lighten[25],
      }),
    }),
  },
})
