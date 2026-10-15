import { Components, Theme } from "@mui/material/styles"

import { neutral } from "./colors"
import { outer } from "./shadows"

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
      paper: ({ theme }) => ({
        // Dialogs are 480px wide on desktop with a 16px radius. Light mode is white with a 1px
        // border and the outer.lg shadow. Dark mode keeps its own border and the elevation shadow.
        backgroundImage: "none",
        borderRadius: 16,
        maxWidth: 480,
        ...(theme.palette.mode === "light" && {
          backgroundColor: neutral.white,
          border: `1px solid ${neutral[300]}`,
          boxShadow: outer.lg,
        }),
        ...theme.applyStyles("dark", {
          backgroundColor: neutral[900],
          border: `1px solid ${neutral[800]}`,
        }),
      }),
    },
  }
}
