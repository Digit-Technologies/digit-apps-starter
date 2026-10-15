import { Components, Theme } from "@mui/material/styles"

// Plain MUI tables match the Figma table: 36px rows with vertical and horizontal dividers.
export const muiTableCell = (): Components<Omit<Theme, "components">>["MuiTableCell"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      height: "36px",
      padding: "0 8px",
      fontSize: "13px",
      fontWeight: 400,
      lineHeight: "20px",
      color: theme.palette.text.primary,
      borderRight: `1px solid ${theme.palette.divider}`,
      borderBottom: `1px solid ${theme.palette.divider}`,
    }),
    head: ({ theme }) => ({
      fontSize: "13px",
      fontWeight: 400,
      color: theme.palette.text.secondary,
      borderRight: `1px solid ${theme.palette.divider}`,
      borderBottom: `1px solid ${theme.palette.divider}`,
    }),
  },
})
