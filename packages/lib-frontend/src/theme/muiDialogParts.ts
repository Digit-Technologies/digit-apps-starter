import { Components, Theme } from "@mui/material/styles"

// Title, body, and actions match the native dialog. The title is 16px semibold. The actions sit
// under a divider, and each dialog lays out its own buttons.
export const muiDialogTitle = (): Components<Omit<Theme, "components">>["MuiDialogTitle"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      ...theme.typography.h5,
      padding: "20px 20px 8px",
      color: theme.palette.text.primary,
    }),
  },
})

export const muiDialogContent = (): Components<Omit<Theme, "components">>["MuiDialogContent"] => ({
  styleOverrides: {
    root: {
      padding: "0 20px 16px",
    },
  },
})

export const muiDialogActions = (): Components<Omit<Theme, "components">>["MuiDialogActions"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      borderTop: `1px solid ${theme.palette.divider}`,
      padding: "12px 20px",
      gap: 8,
    }),
  },
})
