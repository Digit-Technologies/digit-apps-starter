import { Components, Theme } from "@mui/material/styles"

import { neutral } from "./colors"

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
        // Native dialogs are white, borderless, and rounded to 16px. The shadow comes from the
        // theme's shadow scale.
        backgroundColor: neutral.white,
        backgroundImage: "none",
        borderRadius: 16,
        ...theme.applyStyles("dark", {
          backgroundColor: neutral[900],
          border: `1px solid ${neutral[800]}`,
        }),
      }),
    },
  }
}
