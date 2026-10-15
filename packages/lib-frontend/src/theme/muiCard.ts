import { Components, Theme } from "@mui/material/styles"

// Native cards are outlined, not raised: a 12px radius and a border, with no shadow.
export const muiCard = (): Components<Omit<Theme, "components">>["MuiCard"] => ({
  defaultProps: {
    variant: "outlined",
  },
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: 12,
      borderColor: theme.palette.border.strong,
      backgroundColor: theme.palette.background.surface,
      boxShadow: "none",
    }),
  },
})
