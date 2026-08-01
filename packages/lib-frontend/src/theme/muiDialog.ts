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
        backgroundColor: neutral[50],
        backgroundImage: "none",
        border: `1px solid ${neutral[200]}`,
        ...theme.applyStyles("dark", {
          backgroundColor: neutral[900],
          border: `1px solid ${neutral[800]}`,
        }),
      }),
    },
  }
}
