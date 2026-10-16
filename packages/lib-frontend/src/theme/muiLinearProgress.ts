import { Components, Theme } from "@mui/material/styles"

import { emerald, neutralAlpha } from "./colors"

// Figma progress spec (node 10060:222405). The fill colour is the default and primary colour.
export const muiLinearProgress = (): Components<
  Omit<Theme, "components">
>["MuiLinearProgress"] => {
  const fill = {
    borderRadius: 4,
    backgroundColor: emerald[500],
  }

  return {
    styleOverrides: {
      root: ({ theme }) => ({
        height: 8,
        borderRadius: 16,
        backgroundColor: neutralAlpha.darken[100],
        ...theme.applyStyles("dark", {
          backgroundColor: neutralAlpha.lighten[100],
        }),
      }),
      bar: fill,
      bar1: fill,
      bar2: ({ theme }) => ({
        borderRadius: 4,
        backgroundColor: neutralAlpha.darken[100],
        ...theme.applyStyles("dark", {
          backgroundColor: neutralAlpha.lighten[100],
        }),
      }),
    },
  }
}
