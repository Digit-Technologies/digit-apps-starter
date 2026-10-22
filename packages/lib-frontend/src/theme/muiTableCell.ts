import { Components, Theme } from "@mui/material/styles"

// Plain MUI tables are Figma's small fixed lists (Settings > Roles, 25395:22482): 36px rows,
// px 8, 13/16 text and horizontal lines only, in theme-spacing units so rows grow to 45 below
// 600px. Vertical column lines belong to the DataGrid.
export const muiTableCell = (): Components<Omit<Theme, "components">>["MuiTableCell"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      ...theme.typography.body1,
      height: theme.spacing(4.5),
      padding: theme.spacing(0, 1),
      color: theme.palette.text.primary,
      borderBottom: `1px solid ${theme.palette.border.default}`,
    }),
    head: ({ theme }) => ({
      ...theme.typography.body1,
      color: theme.palette.text.secondary,
    }),
    // MUI's small size sets its own padding; keep the Figma 36px row at either size.
    sizeSmall: ({ theme }) => ({
      padding: theme.spacing(0, 1),
    }),
  },
})
