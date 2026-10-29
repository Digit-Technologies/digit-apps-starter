import { Components, Theme } from "@mui/material/styles"

import { neutralAlpha } from "./colors.js"

// Figma dialog/scrim: rgba(0,0,0,.1) plus Blur/Scrim (a Figma background blur of 2, about a 1px
// CSS blur). A 10% black scrim vanishes on the dark page, so dark mode keeps a 50% scrim.
export const muiBackdrop = (): Components<
  Omit<Theme, "components">
>["MuiBackdrop"] => {
  return {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: neutralAlpha.darken[100],
        backdropFilter: "blur(1px)",
        ...theme.applyStyles("dark", {
          backgroundColor: neutralAlpha.darken[500],
        }),
        // Menus, popovers and selects use an invisible backdrop: no tint and no blur. These
        // rules come after the tint above, so they win over it.
        "&.MuiBackdrop-invisible": {
          backgroundColor: "transparent",
          backdropFilter: "none",
        },
      }),
    },
  }
}
