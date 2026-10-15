import React, { ReactNode } from "react"

import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import {
  DataGrid,
  GridColDef,
  GridFooterContainer,
  GridPaginationModel,
  GridRowId,
  GridSortModel,
  GridValidRowModel,
  gridPageCountSelector,
  gridPaginationModelSelector,
  gridPaginationRowCountSelector,
  useGridApiContext,
  useGridSelector,
} from "@mui/x-data-grid"
import { ChevronRight, Search } from "../icons"

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

// Reads paging state from the grid API, so it needs no props from Table.
function TableFooter() {
  const apiRef = useGridApiContext()
  const { page, pageSize } = useGridSelector(apiRef, gridPaginationModelSelector)
  const rowCount = useGridSelector(apiRef, gridPaginationRowCountSelector)
  const pageCount = useGridSelector(apiRef, gridPageCountSelector)

  const first = rowCount === 0 ? 0 : page * pageSize + 1
  const last = Math.min((page + 1) * pageSize, rowCount)

  return (
    <GridFooterContainer sx={{ justifyContent: "flex-end", gap: 1, px: 1 }}>
      <Typography variant="overline" sx={{ color: "text.tertiary" }}>
        {first}-{last} of {rowCount}
      </Typography>
      <IconButton
        aria-label="Previous page"
        disabled={page === 0}
        onClick={() => apiRef.current.setPage(page - 1)}
      >
        <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} />
      </IconButton>
      <IconButton
        aria-label="Next page"
        disabled={page >= pageCount - 1}
        onClick={() => apiRef.current.setPage(page + 1)}
      >
        <ChevronRight size={16} />
      </IconButton>
    </GridFooterContainer>
  )
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
              variant="filled"
              hiddenLabel
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
        loading={loading}
        autoHeight
        slots={{ footer: TableFooter }}
        onRowClick={onRowClick ? (params) => onRowClick(params.row) : undefined}
        sx={{
          "& .MuiDataGrid-row": {
            cursor: onRowClick ? "pointer" : "default",
          },
        }}
      />
    </Stack>
  )
}
