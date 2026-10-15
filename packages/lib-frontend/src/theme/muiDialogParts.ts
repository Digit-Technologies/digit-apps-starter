import { Components, Theme } from "@mui/material/styles"

// Title, content, and actions match the Figma dialog. Each part has 16px padding. The title and
// the actions each sit against a 1px strong border.
export const muiDialogTitle = (): Components<Omit<Theme, "components">>["MuiDialogTitle"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      ...theme.typography.h5,
      lineHeight: "24px",
      padding: 16,
      borderBottom: `1px solid ${theme.palette.border.strong}`,
      color: theme.palette.text.primary,
    }),
  },
})

export const muiDialogContent = (): Components<Omit<Theme, "components">>["MuiDialogContent"] => ({
  styleOverrides: {
    root: {
      padding: 16,
    },
  },
})

export const muiDialogActions = (): Components<Omit<Theme, "components">>["MuiDialogActions"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      padding: 16,
      borderTop: `1px solid ${theme.palette.border.strong}`,
      gap: 8,
      justifyContent: "flex-end",
    }),
  },
})
