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
        // Border, radius, and shadow apply to every dialog size. Width is set per size below.
        backgroundImage: "none",
        borderRadius: 16,
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
      // The 480px width is the small size only, so md and lg dialogs keep their widths.
      paperWidthSm: { maxWidth: 480 },
      // Full screen dialogs fill the viewport with no radius.
      paperFullScreen: { maxWidth: "100%", borderRadius: 0 },
    },
  }
}
