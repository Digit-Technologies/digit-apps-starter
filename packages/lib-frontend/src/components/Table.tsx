import React, { ReactNode } from "react"

import InputAdornment from "@mui/material/InputAdornment"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridRowId,
  GridSortModel,
  GridValidRowModel,
} from "@mui/x-data-grid"
import { Search } from "../icons"

export interface TableProps<Row extends GridValidRowModel> {
  rows: Row[]
  columns: GridColDef<Row>[]
  getRowId?: (row: Row) => GridRowId
  /** Total rows across every page, from the server. Drives the pager. */
  rowCount: number
  paginationModel: GridPaginationModel
  onPaginationModelChange: (model: GridPaginationModel) => void
  /** Sort state. Sorting happens on the server, so the app refetches when it changes. */
  sortModel?: GridSortModel
  onSortModelChange?: (model: GridSortModel) => void
  /** Search text. Pass both props to show the search field. Search runs on the server too. */
  search?: string
  onSearchChange?: (search: string) => void
  searchPlaceholder?: string
  /** Toolbar content on the right, usually the page's primary action. */
  actions?: ReactNode
  loading?: boolean
  onRowClick?: (row: Row) => void
  pageSizeOptions?: number[]
}

/**
 * A paginated list of records. Paging, sorting and search are controlled by the app and run on
 * the server, so pass the current model and refetch in the change handlers. Use it for any
 * list of records instead of building a table from MUI primitives.
 */
export function Table<Row extends GridValidRowModel>({
  rows,
  columns,
  getRowId,
  rowCount,
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
  search,
  onSearchChange,
  searchPlaceholder = "Search",
  actions,
  loading = false,
  onRowClick,
  pageSizeOptions = [10, 25, 50],
}: TableProps<Row>) {
  const sortable = Boolean(onSortModelChange)

  return (
    <Stack spacing={2}>
      {(onSearchChange || actions) && (
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          {onSearchChange ? (
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={search ?? ""}
              onChange={(event) => onSearchChange(event.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ maxWidth: 320, width: "100%" }}
            />
          ) : (
            <span />
          )}
          {actions}
        </Stack>
      )}
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={getRowId}
        rowCount={rowCount}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        pageSizeOptions={pageSizeOptions}
        sortingMode="server"
        sortModel={sortModel}
        onSortModelChange={onSortModelChange}
        disableColumnSorting={!sortable}
        disableColumnFilter
        disableColumnMenu
        disableRowSelectionOnClick
        hideFooterSelectedRowCount
        loading={loading}
        autoHeight
        // Native lists are 36px rows under a 36px header, and sit flat without an outer card.
        rowHeight={36}
        columnHeaderHeight={36}
        onRowClick={onRowClick ? (params) => onRowClick(params.row) : undefined}
        sx={(theme) => ({
          border: "none",
          backgroundColor: theme.palette.background.paper,
          fontSize: "13px",
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "transparent",
            borderBottomColor: theme.palette.divider,
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            color: theme.palette.text.secondary,
            fontSize: "12px",
            fontWeight: 500,
          },
          "& .MuiDataGrid-columnSeparator": {
            color: theme.palette.divider,
          },
          "& .MuiDataGrid-cell": {
            borderBottomColor: theme.palette.divider,
            fontWeight: 400,
          },
          "& .MuiDataGrid-row": {
            cursor: onRowClick ? "pointer" : "default",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: theme.palette.action.hover,
          },
          "& .MuiDataGrid-footerContainer": {
            borderTopColor: theme.palette.divider,
          },
        })}
      />
    </Stack>
  )
}
