import { Components, Theme } from "@mui/material/styles"

// Plain MUI tables match the native list: 13px rows with light dividers, and 12px medium
// secondary headers. DataGrid is styled in components/Table.tsx.
export const muiTableCell = (): Components<Omit<Theme, "components">>["MuiTableCell"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      fontSize: "13px",
      lineHeight: "20px",
      padding: theme.spacing(1, 1.5),
      borderBottom: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.primary,
    }),
    head: ({ theme }) => ({
      fontSize: "12px",
      fontWeight: 500,
      color: theme.palette.text.secondary,
      borderBottom: `1px solid ${theme.palette.divider}`,
    }),
  },
})
