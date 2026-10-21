import { Components, Theme } from "@mui/material/styles"

import { emerald, neutralAlpha } from "./colors"

// Figma progress spec (node 10060:222405). Emerald is the fill for the default (primary) colour.
// Other colours, such as color="error" for an over-quota bar, keep MUI's palette fill.
export const muiLinearProgress = (): Components<
  Omit<Theme, "components">
>["MuiLinearProgress"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      height: 8,
      borderRadius: 16,
      backgroundColor: neutralAlpha.darken[100],
      ...theme.applyStyles("dark", {
        backgroundColor: neutralAlpha.lighten[100],
      }),
    }),
    bar: ({ ownerState }) => ({
      borderRadius: 4,
      ...((ownerState.color ?? "primary") === "primary" && { backgroundColor: emerald[500] }),
    }),
    // bar2 is the second moving bar in the indeterminate and query animations, so it keeps the
    // fill there. Only the buffer variant uses it as the grey buffer track.
    bar2: ({ ownerState, theme }) =>
      ownerState.variant === "buffer"
        ? {
            backgroundColor: neutralAlpha.darken[100],
            ...theme.applyStyles("dark", {
              backgroundColor: neutralAlpha.lighten[100],
            }),
          }
        : {},
  },
})
