import { Components, Theme } from "@mui/material/styles"

import { blue, neutralAlpha, stone } from "./colors"

// The 2px underline is a per-tab ::after so hover and pressed states can tint it. The selected
// underline is the Tabs indicator.
export const muiTab = (): Components<Omit<Theme, "components">>["MuiTab"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      position: "relative",
      minHeight: theme.spacing(4.5),
      padding: theme.spacing(0, 1),
      fontSize: "13px",
      fontWeight: 500,
      lineHeight: "16px",
      textTransform: "none",
      color: stone[550],
      "&::after": {
        content: '""',
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 2,
        backgroundColor: "transparent",
      },
      "&:hover::after": {
        backgroundColor: neutralAlpha.darken[50],
      },
      "&:active::after": {
        backgroundColor: neutralAlpha.darken[100],
      },
      "&.Mui-selected": {
        color: theme.palette.text.primary,
      },
      "&.Mui-focusVisible": {
        outline: `2px solid ${blue[600]}`,
        outlineOffset: -2,
      },
    }),
  },
})

export const muiTabs = (): Components<Omit<Theme, "components">>["MuiTabs"] => {
  return {
    styleOverrides: {
      root: ({ theme }) => ({
        alignItems: "center",
        borderBottom: `1px solid ${theme.palette.border.default}`,
        height: theme.spacing(4.5),
        mb: 0,
        minHeight: theme.spacing(4.5),
        mt: 0,
        transition: "none",
        width: "100%",
      }),
    },
  }
}
