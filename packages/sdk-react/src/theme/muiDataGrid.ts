import { Components, Theme } from "@mui/material/styles"
// Type-only: adds the MuiDataGrid keys to Components. Erased at emit, so no runtime import.
import type {} from "@mui/x-data-grid/themeAugmentation"

import { focusColor } from "./focus.js"
import { neutralAlpha } from "./colors.js"

// DataGrid matches the Figma index table (Molecules 12255:55508): 36px header and rows, px 8,
// 1px border.default lines below and right of every cell, 13/16 text, and no outer border.
// Behaviour props (sorting, paging, selection) and the page gutter stay in components/DataTable.tsx.
export const muiDataGrid = (): Components<Omit<Theme, "components">>["MuiDataGrid"] => ({
  defaultProps: {
    rowHeight: 36,
    columnHeaderHeight: 36,
    showColumnVerticalBorder: true,
    showCellVerticalBorder: true,
  },
  styleOverrides: {
    root: ({ theme }) => {
      const { border, table, text, background } = theme.palette
      const dark = theme.palette.mode === "dark"
      return {
        border: "none",
        borderRadius: 0,
        backgroundColor: background.paper,
        fontSize: theme.typography.body1.fontSize,
        // Every line in the grid reads this variable: row lines, column lines, header bottom.
        "--DataGrid-rowBorderColor": border.default,
        // The grid mixes 5% white into paper in dark mode. Figma keeps the table on paper.
        // Two classes, so this beats the grid's own variables class.
        "&.MuiDataGrid-root": {
          "--DataGrid-t-color-background-base": background.paper,
          "--DataGrid-t-header-background-base": background.paper,
          "--DataGrid-t-cell-background-pinned": background.paper,
        },

        // Header cell (12627:26083): px 8, 4 gap, body1 label in text.secondary.
        "& .MuiDataGrid-columnHeaders": {
          backgroundColor: "transparent",
        },
        "& .MuiDataGrid-columnHeader": {
          padding: theme.spacing(0, 1),
        },
        "& .MuiDataGrid-columnHeaderTitleContainer": {
          gap: theme.spacing(0.5),
        },
        "& .MuiDataGrid-columnHeaderTitle, & .digit-Table-headerLabel": {
          ...theme.typography.body1,
          color: text.secondary,
          fontWeight: 400,
        },
        // Header icon from `TableColumn.icon`: 12px, before the label, label ellipsises.
        "& .digit-Table-header": {
          display: "flex",
          alignItems: "center",
          gap: theme.spacing(0.5),
          minWidth: 0,
          color: text.secondary,
          "& svg": { flexShrink: 0 },
        },
        "& .digit-Table-headerLabel": {
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },
        "& .MuiDataGrid-sortIcon": {
          fontSize: "14px",
          color: text.secondary,
        },
        "& .MuiDataGrid-columnHeader--sortable:hover": {
          backgroundColor: table.hover,
        },
        "& .MuiDataGrid-columnSeparator": {
          color: border.default,
        },

        // Custom cells (RecordName, Pill) centre vertically like plain text cells do.
        "& .MuiDataGrid-cell": {
          display: "flex",
          alignItems: "center",
          padding: theme.spacing(0, 1),
          ...theme.typography.body1,
          color: text.primary,
        },
        "& .MuiDataGrid-cell--textRight": {
          justifyContent: "flex-end",
        },
        "& .MuiDataGrid-cell--textCenter": {
          justifyContent: "center",
        },

        // The primary (first) column, and the checkbox column before it, have no right border.
        [[
          "& .MuiDataGrid-cellCheckbox",
          "& .MuiDataGrid-columnHeaderCheckbox",
          '& .MuiDataGrid-cell[aria-colindex="1"]',
          '& .MuiDataGrid-columnHeader[aria-colindex="1"]',
          "& .MuiDataGrid-cellCheckbox + .MuiDataGrid-cell",
          "& .MuiDataGrid-columnHeaderCheckbox + .MuiDataGrid-columnHeader",
        ].join(", ")]: {
          borderRightColor: "transparent",
        },
        // Checkbox column: 60 wide, checkbox at the left (Table moves it to the page gutter).
        "& .MuiDataGrid-cellCheckbox, & .MuiDataGrid-columnHeaderCheckbox": {
          justifyContent: "flex-start",
          "& .MuiDataGrid-columnHeaderTitleContainer": { justifyContent: "flex-start" },
          "& .MuiCheckbox-root": { padding: 0 },
        },

        // Row states: Figma table/row/background/hover and /selected.
        "& .MuiDataGrid-row:hover": {
          backgroundColor: table.hover,
        },
        "& .MuiDataGrid-row.Mui-selected, & .MuiDataGrid-row.Mui-selected:hover": {
          backgroundColor: table.selected,
        },
        // A RecordName link in a hovered row underlines, like Figma's hover state.
        "& .MuiDataGrid-row:hover .digit-RecordName-link": {
          textDecoration: "underline",
          textDecorationThickness: "1px",
          textUnderlinePosition: "from-font",
          textDecorationColor: dark ? neutralAlpha.lighten[250] : neutralAlpha.darken[250],
        },

        // Clicking a cell focuses it; only show the outline for keyboard focus.
        "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within":
          {
            outline: "none",
          },
        "& .MuiDataGrid-cell:focus-visible, & .MuiDataGrid-columnHeader:focus-visible": {
          outline: `2px solid ${focusColor(theme)}`,
          outlineOffset: "-2px",
        },

        "& .MuiDataGrid-footerContainer": {
          borderTopColor: border.default,
        },
        "& .MuiDataGrid-overlay": {
          backgroundColor: "transparent",
          ...theme.typography.body1,
          color: text.tertiary,
        },
      }
    },
  },
})
