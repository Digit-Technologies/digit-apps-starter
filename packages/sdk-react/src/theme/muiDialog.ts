import { Breakpoint, Components, Theme } from "@mui/material/styles"

import { neutral } from "./colors.js"
import { outer } from "./shadows.js"

/** Figma dialog/width tokens. Dialog `maxWidth="xs" | "sm" | "md" | "lg"` maps onto them. */
export const dialogWidths: Partial<Record<Breakpoint, number>> = {
  xs: 336,
  sm: 480,
  md: 680,
  lg: 960,
}

export const muiDialog = (): Components<
  Omit<Theme, "components">
>["MuiDialog"] => {
  return {
    styleOverrides: {
      root: {
        // needed so only one modal overlay (the top most) is shown when many modals are open
        '&[aria-hidden="true"] .MuiBackdrop-root': {
          opacity: "0 !important",
          transition: "opacity 225ms ease-in-out !important",
        },
      },
      // Figma Modal mobile (10779:83430): below 600px the dialog is a bottom sheet.
      container: ({ theme, ownerState }) => ({
        ...(!ownerState.fullScreen &&
          ownerState.scroll !== "body" && {
            [theme.breakpoints.down("sm")]: {
              alignItems: "flex-end",
            },
          }),
      }),
      // Every rule lives in `paper`, after the width, so the mobile sheet can override the width.
      // MUI's own paperWidth* rules come first and lose to these.
      paper: ({ theme, ownerState }) => {
        const width =
          ownerState.maxWidth && ownerState.maxWidth in dialogWidths
            ? dialogWidths[ownerState.maxWidth as Breakpoint]
            : undefined
        return {
          // Figma Modal: white with the 1px dialog/border (#d4d4d4) in light mode. Dark mode uses
          // paper (#292524) with paper/border/solid/strong (#525252).
          backgroundColor: theme.palette.background.paper,
          backgroundImage: "none",
          border: `1px solid ${
            theme.palette.mode === "dark" ? theme.palette.border.solidStrong : neutral[300]
          }`,
          borderRadius: theme.spacing(2),
          boxShadow: outer.lg,
          // 32px from every viewport edge.
          margin: 32,
          ...(width && { maxWidth: `min(${width}px, calc(100% - 64px))` }),
          ...(ownerState.fullScreen && { maxWidth: "100%", margin: 0, borderRadius: 0 }),
          ...(!ownerState.fullScreen &&
            ownerState.scroll !== "body" && {
              [theme.breakpoints.down("sm")]: {
                // Full width, 20px from the top, filling to the bottom. Only the top corners
                // are rounded, at the mobile paper radius of 20.
                margin: 0,
                marginTop: 20,
                width: "100%",
                maxWidth: "100%",
                height: "calc(100% - 20px)",
                maxHeight: "calc(100% - 20px)",
                borderRadius: theme.spacing(2, 2, 0, 0),
              },
            }),
        }
      },
    },
  }
}
