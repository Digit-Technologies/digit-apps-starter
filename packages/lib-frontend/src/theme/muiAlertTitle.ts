import { Components, Theme } from "@mui/material/styles"

// Figma body2 title over the subtitle, with the 4px column gap.
export const muiAlertTitle = (): Components<Omit<Theme, "components">>["MuiAlertTitle"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      ...theme.typography.body2,
      color: theme.palette.text.primary,
      margin: 0,
      marginBottom: theme.spacing(0.5),
      "&:last-child": { marginBottom: 0 },
    }),
  },
})
