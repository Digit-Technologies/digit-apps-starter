import { Components, Theme } from "@mui/material/styles"

import { emerald, neutralAlpha } from "./colors"

// Figma progress spec (node 10060:222405): 8px track (theme-spacing-1, so it scales on mobile),
// radius 16, a.10 / w.10 track. Emerald is the fill for the default (primary) colour. Other
// colours, such as color="error" for an over-quota bar, keep MUI's palette fill. For the caption
// row ("value / total unit") use the ProgressBar component.
export const muiLinearProgress = (): Components<
  Omit<Theme, "components">
>["MuiLinearProgress"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      height: theme.spacing(1),
      borderRadius: theme.spacing(2),
      backgroundColor: neutralAlpha.darken[100],
      ...theme.applyStyles("dark", {
        backgroundColor: neutralAlpha.lighten[100],
      }),
    }),
    bar: ({ ownerState, theme }) => ({
      borderRadius: theme.spacing(0.5),
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
