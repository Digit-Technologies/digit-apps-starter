import { Components, Theme } from "@mui/material/styles"

import { neutralAlpha } from "./colors"

// The compact form field. A grey fill with no underline, used inside form rows and settings panels.
export const muiFilledInput = (): Components<Omit<Theme, "components">>["MuiFilledInput"] => ({
  defaultProps: {
    disableUnderline: true,
  },
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: 8,
      backgroundColor: neutralAlpha.darken[50],
      "&:hover": {
        backgroundColor: neutralAlpha.darken[100],
      },
      "&.Mui-focused": {
        backgroundColor: neutralAlpha.darken[50],
        boxShadow: `0 0 0 1px ${theme.palette.border.extrastrong} inset`,
      },
    }),
    input: {
      padding: "6px 8px",
      fontSize: "13px",
      lineHeight: "20px",
    },
  },
})
