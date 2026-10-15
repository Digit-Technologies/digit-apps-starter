import { Components, Theme } from "@mui/material/styles"

import { blue, neutralAlpha, red } from "./colors"

// The compact form field. A grey fill with no underline, used inside form rows and settings panels.
export const muiFilledInput = (): Components<Omit<Theme, "components">>["MuiFilledInput"] => ({
  defaultProps: {
    disableUnderline: true,
  },
  styleOverrides: {
    root: ({ ownerState, theme }) => {
      const isDark = theme.palette.mode === "dark"
      const fill = isDark ? neutralAlpha.lighten[50] : neutralAlpha.darken[50]
      const hoverFill = isDark ? neutralAlpha.lighten[100] : neutralAlpha.darken[100]
      return {
      borderRadius: 8,
      backgroundColor: fill,
      "&:hover": {
        backgroundColor: hoverFill,
      },
      "&:active": {
        backgroundColor: hoverFill,
      },
      "&.Mui-focused": {
        backgroundColor: fill,
      },
      // The focusable element is the inner input, so :has() reaches it from the root.
      "&:has(input:focus-visible)": {
        boxShadow: `0 0 0 1px ${blue[600]} inset`,
      },
      "&.Mui-error": {
        boxShadow: `0 0 0 1px ${red[500]} inset`,
      },
      ...(ownerState.size === "small" ? { minHeight: "20px", borderRadius: 6 } : {}),
      }
    },
    input: ({ theme, ownerState }) => ({
      // Only hidden-label fields get the compact padding. Labelled fields keep MUI's label space.
      ...(ownerState.hiddenLabel ? { padding: ownerState.size === "small" ? "2px 4px" : "6px 8px" } : {}),
      fontSize: "13px",
      lineHeight: "16px",
      "&::placeholder": {
        color: theme.palette.mode === "light" ? neutralAlpha.darken[400] : neutralAlpha.lighten[400],
        opacity: 1,
      },
    }),
  },
})
