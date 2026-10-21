import { Components, Theme } from "@mui/material/styles"
// Type-only: adds the MuiDataGrid keys to Components. Erased at emit, so no runtime import.
import type {} from "@mui/x-data-grid/themeAugmentation"

// DataGrid matches the Figma table: 36px rows and header, vertical column dividers, and 13px text.
// Behaviour props (sorting, paging, selection) stay in components/Table.tsx.
export const muiDataGrid = (): Components<Omit<Theme, "components">>["MuiDataGrid"] => ({
  defaultProps: {
    rowHeight: 36,
    columnHeaderHeight: 36,
    showColumnVerticalBorder: true,
  },
  styleOverrides: {
    root: ({ theme }) => ({
      border: "none",
      backgroundColor: theme.palette.background.paper,
      fontSize: "13px",
      "& .MuiDataGrid-columnHeaders": {
        backgroundColor: "transparent",
        borderBottomColor: theme.palette.divider,
      },
      "& .MuiDataGrid-columnHeaderTitle": {
        color: theme.palette.text.secondary,
        fontSize: "13px",
        fontWeight: 400,
      },
      "& .MuiDataGrid-columnSeparator": {
        color: theme.palette.divider,
      },
      // Custom cells (RecordName, Pill) centre vertically like plain text cells do.
      "& .MuiDataGrid-cell": {
        display: "flex",
        alignItems: "center",
        padding: "0 8px",
        color: theme.palette.text.primary,
        fontSize: "13px",
        fontWeight: 400,
        borderBottomColor: theme.palette.divider,
      },
      "& .MuiDataGrid-cell--textRight": {
        justifyContent: "flex-end",
      },
      "& .MuiDataGrid-cell--textCenter": {
        justifyContent: "center",
      },
      "& .MuiDataGrid-row:hover": {
        backgroundColor: theme.palette.action.hover,
      },
      "& .MuiDataGrid-footerContainer": {
        borderTopColor: theme.palette.divider,
      },
    }),
  },
})
