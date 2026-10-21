import { Components, Theme } from "@mui/material/styles"

// Plain MUI tables are Figma's small fixed lists (Settings > Roles, 25395:22482): 36px rows,
// px 8, 13/16 text and horizontal lines only. Vertical column lines belong to the DataGrid.
export const muiTableCell = (): Components<Omit<Theme, "components">>["MuiTableCell"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      ...theme.typography.body1,
      height: "36px",
      padding: "0 8px",
      color: theme.palette.text.primary,
      borderBottom: `1px solid ${theme.palette.border.default}`,
    }),
    head: ({ theme }) => ({
      ...theme.typography.body1,
      color: theme.palette.text.secondary,
    }),
    // MUI's small size sets its own padding; keep the Figma 36px row at either size.
    sizeSmall: {
      padding: "0 8px",
    },
  },
})
