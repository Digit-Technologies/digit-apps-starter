import { Components, Theme } from "@mui/material/styles"

// Plain MUI table rows use the Figma table/row/background tokens, like DataGrid rows do.
export const muiTableRow = (): Components<Omit<Theme, "components">>["MuiTableRow"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      "&.MuiTableRow-hover:hover": {
        backgroundColor: theme.palette.table.hover,
      },
      "&.Mui-selected, &.Mui-selected:hover": {
        backgroundColor: theme.palette.table.selected,
      },
    }),
  },
})
