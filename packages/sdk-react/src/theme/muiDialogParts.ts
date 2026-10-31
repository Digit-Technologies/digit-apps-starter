import { Components, Theme } from "@mui/material/styles"

// Title, content, and actions match the Figma Modal (10741:39951). Each part has 16px padding
// (20 on mobile). The title and the actions each sit against a 1px strong border.
export const muiDialogTitle = (): Components<Omit<Theme, "components">>["MuiDialogTitle"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      // h5 16/24, 20/30 on mobile.
      ...theme.typography.h5,
      padding: theme.spacing(2),
      borderBottom: `1px solid ${theme.palette.border.strong}`,
      color: theme.palette.text.primary,
    }),
  },
})

export const muiDialogContent = (): Components<Omit<Theme, "components">>["MuiDialogContent"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(2),
      // MUI drops the top padding after a DialogTitle. The title here has its own border, so the
      // content keeps its full padding.
      ".MuiDialogTitle-root + &": {
        paddingTop: theme.spacing(2),
      },
      // Figma content is a stack of sections (Section children) that pad themselves.
      "&:has(> .digit-Section)": {
        padding: 0,
      },
    }),
  },
})

export const muiDialogActions = (): Components<Omit<Theme, "components">>["MuiDialogActions"] => ({
  defaultProps: {
    // MUI adds an 8px left margin between actions on top of the gap, doubling it.
    disableSpacing: true,
  },
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(2),
      borderTop: `1px solid ${theme.palette.border.strong}`,
      gap: theme.spacing(1),
      justifyContent: "flex-end",
    }),
  },
})
