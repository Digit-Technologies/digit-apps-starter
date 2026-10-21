import React, { KeyboardEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import InputBase from "@mui/material/InputBase"
import Stack from "@mui/material/Stack"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import useMediaQuery from "@mui/material/useMediaQuery"
import {
  DataGrid,
  GRID_CHECKBOX_SELECTION_COL_DEF,
  GridColDef,
  GridFooterContainer,
  GridPaginationModel,
  GridRowId,
  GridRowSelectionModel,
  GridSortModel,
  GridValidRowModel,
  gridPageCountSelector,
  gridPaginationModelSelector,
  gridPaginationRowCountSelector,
  useGridApiContext,
  useGridSelector,
} from "@mui/x-data-grid"
import type { LucideIcon } from "lucide-react"

import { ChevronLeft, ChevronRight, Download, RefreshCw, Search, X } from "../icons"

/**
 * A DataGrid column. `icon` is the 12px Lucide data-type icon Figma draws before every header
 * label, for example `{ field: "quantity", headerName: "Quantity", icon: Cylinder }`. It is
 * ignored when the column has its own `renderHeader`.
 */
export type TableColumn<Row extends GridValidRowModel = GridValidRowModel> = GridColDef<Row> & {
  icon?: LucideIcon
}

/** A saved view in the toolbar, for example "All", "Open", "Archived". */
export interface TableView {
  value: string
  label: string
}

export interface TableSelection {
  /** Selected row ids. Kept across pages, so the app owns the list. */
  model: GridRowId[]
  onChange: (ids: GridRowId[]) => void
  /** Bulk-action buttons shown after "N selected", usually default (secondary) Buttons. */
  actions?: ReactNode
}

/**
 * The gutter on the first cell's left, the last cell's right, the toolbar and the pager.
 * "page": the 36px page gutter (20px below 600px), for a full-bleed table under a PageHeader.
 * "panel": 16px, inside a side panel or dialog. "none": 0, when the parent already pads.
 */
export type TableInset = "page" | "panel" | "none"

const colSelector = (index: number) =>
  `& .MuiDataGrid-cell[aria-colindex="${index}"], & .MuiDataGrid-columnHeader[aria-colindex="${index}"]`

const gutterRules = <T,>(first: number, last: number, inset: T) =>
  first === last
    ? { [colSelector(first)]: { pl: inset, pr: inset } }
    : { [colSelector(first)]: { pl: inset }, [colSelector(last)]: { pr: inset } }

export interface TableProps<Row extends GridValidRowModel> {
  rows: Row[]
  columns: TableColumn<Row>[]
  getRowId?: (row: Row) => GridRowId
  /** Total rows across every page, from the server. Drives the pager. */
  rowCount: number
  paginationModel: GridPaginationModel
  onPaginationModelChange: (model: GridPaginationModel) => void
  /** Sort state. Sorting happens on the server, so the app refetches when it changes. */
  sortModel?: GridSortModel
  onSortModelChange?: (model: GridSortModel) => void
  /**
   * Search text. Pass both props to show a search icon button in the toolbar. It opens an inline
   * field, and stays open while the text is not empty. Search runs on the server too.
   */
  search?: string
  onSearchChange?: (search: string) => void
  searchPlaceholder?: string
  /** Saved views on the left of the toolbar. The selected one gets the grey (outlined) fill. */
  views?: TableView[]
  view?: string
  onViewChange?: (view: string) => void
  /** Shows a refresh icon button in the toolbar. */
  onRefresh?: () => void
  /** Shows a "Download .csv" icon button in the toolbar. */
  onDownload?: () => void
  /**
   * Extra toolbar content on the right, after the built-in icon buttons: usually more 28px
   * IconButtons with tooltips (filter, columns). The page's primary action goes in the
   * PageHeader `actions`, not here.
   */
  actions?: ReactNode
  /** Adds a checkbox column. While rows are selected the toolbar becomes the bulk-action bar. */
  selection?: TableSelection
  /** Defaults to "page". */
  inset?: TableInset
  /**
   * Row height in px. Defaults to 36. Pass 52 when the name column shows a `RecordName` with
   * `meta` (36px tile plus 8px above and below).
   */
  rowHeight?: number
  loading?: boolean
  onRowClick?: (row: Row) => void
  pageSizeOptions?: number[]
}

const insetVar = "var(--digit-table-inset)"

// Figma page/padding/x/default (36, 20 on mobile) and peek/padding/x/default (16).
const useInsetPx = (inset: TableInset) => {
  const mobile = useMediaQuery("(max-width:599px)")
  if (inset === "none") return 0
  if (inset === "panel") return 16
  return mobile ? 20 : 36
}

// Pager (Molecules 12255:56444): 44px, top border, range label and previous/next on the right.
// Reads paging state from the grid API, so it needs no props from Table.
function TableFooter() {
  const apiRef = useGridApiContext()
  const { page, pageSize } = useGridSelector(apiRef, gridPaginationModelSelector)
  const rowCount = useGridSelector(apiRef, gridPaginationRowCountSelector)
  const pageCount = useGridSelector(apiRef, gridPageCountSelector)

  const first = rowCount === 0 ? 0 : page * pageSize + 1
  const last = Math.min((page + 1) * pageSize, rowCount)

  return (
    <GridFooterContainer
      sx={{
        justifyContent: "flex-end",
        gap: 1,
        // 44 tall including the top border (Figma py 8 around 28px buttons).
        boxSizing: "border-box",
        height: 44,
        minHeight: 44,
        py: 0,
        px: insetVar,
        borderTop: 1,
        borderColor: "border.default",
      }}
    >
      <Typography variant="overline" sx={{ color: "text.tertiary" }}>
        {first}–{last} of {rowCount}
      </Typography>
      <IconButton
        aria-label="Previous page"
        disabled={page === 0}
        onClick={() => apiRef.current.setPage(page - 1)}
      >
        <ChevronLeft size={16} />
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

const HeaderLabel = ({ icon: Icon, label }: { icon: LucideIcon; label: string }) => (
  <span className="digit-Table-header">
    <Icon size={12} />
    <span className="digit-Table-headerLabel">{label}</span>
  </span>
)

// Search starts as an icon button and opens into an invisible field ("Search…").
function TableSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const [opened, setOpened] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef(false)
  const open = opened || value !== ""

  // After Escape, give focus back to the icon button once it renders again.
  useEffect(() => {
    if (open || !returnFocus.current) return
    returnFocus.current = false
    buttonRef.current?.focus()
  }, [open])

  const close = () => {
    returnFocus.current = true
    setOpened(false)
  }

  if (!open) {
    return (
      <Tooltip title="Search">
        <IconButton ref={buttonRef} aria-label="Search" onClick={() => setOpened(true)}>
          <Search size={16} />
        </IconButton>
      </Tooltip>
    )
  }

  return (
    <InputBase
      autoFocus={opened}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      onBlur={() => value === "" && setOpened(false)}
      onKeyDown={(event: KeyboardEvent) => {
        if (event.key !== "Escape") return
        if (value !== "") onChange("")
        close()
      }}
      inputProps={{ "aria-label": "Search" }}
      startAdornment={<Search size={16} />}
      sx={(theme) => ({
        ...theme.typography.body1,
        width: 200,
        height: 28,
        px: 1,
        gap: 0.5,
        borderRadius: "8px",
        color: "text.primary",
        "& svg": { flexShrink: 0, color: theme.palette.text.secondary },
        "& input": { p: 0, height: "auto" },
        "& input::placeholder": { color: theme.palette.text.tertiary, opacity: 1 },
      })}
    />
  )
}

const toolbarSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 1,
  minHeight: 44,
  px: insetVar,
  borderBottom: 1,
} as const

/**
 * A paginated, full-bleed list of records (Figma index table, Molecules 12255:55508). Paging,
 * sorting and search are controlled by the app and run on the server, so pass the current model
 * and refetch in the change handlers. Use it for any list of records instead of building a table
 * from MUI primitives.
 *
 * The toolbar shows saved `views` on the left and search, refresh, download and `actions` on
 * the right; it only renders when one of those is set. Name cells are usually
 * `<RecordName name link />` (pass `rowHeight={52}` when it has `meta`). Give one column
 * `flex: 1` so the table fills the width and the last column reaches the right gutter.
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
  searchPlaceholder = "Search…",
  views,
  view,
  onViewChange,
  onRefresh,
  onDownload,
  actions,
  selection,
  inset = "page",
  rowHeight,
  loading = false,
  onRowClick,
  pageSizeOptions = [10, 25, 50],
}: TableProps<Row>) {
  const sortable = Boolean(onSortModelChange)
  const insetPx = useInsetPx(inset)
  const selecting = Boolean(selection)
  const selected = selection?.model ?? []

  const gridColumns = useMemo(() => {
    const mapped = columns.map(({ icon, ...column }) =>
      icon && !column.renderHeader
        ? ({
            ...column,
            renderHeader: () => <HeaderLabel icon={icon} label={column.headerName ?? column.field} />,
          } as GridColDef<Row>)
        : (column as GridColDef<Row>),
    )
    if (!selecting) return mapped
    // Figma checkbox column: the gutter, the 16px checkbox, then 8px.
    const width = insetPx + 24
    return [{ ...GRID_CHECKBOX_SELECTION_COL_DEF, width, minWidth: width, maxWidth: width }, ...mapped]
  }, [columns, selecting, insetPx])

  const rowSelectionModel = useMemo<GridRowSelectionModel>(
    () => ({ type: "include", ids: new Set(selected) }),
    [selected],
  )

  const handleSelectionChange = (model: GridRowSelectionModel) => {
    if (!selection) return
    if (model.type === "include") {
      selection.onChange([...model.ids])
      return
    }
    // "Select all" comes back as "everything except these". With server paging that means the
    // rows on this page, plus whatever was already selected on other pages.
    const idOf = (row: Row): GridRowId => (getRowId ? getRowId(row) : (row.id as GridRowId))
    const pageIds = rows.map(idOf)
    const onPage = new Set(pageIds)
    selection.onChange([
      ...selected.filter((id) => !onPage.has(id)),
      ...pageIds.filter((id) => !model.ids.has(id)),
    ])
  }

  const hasViews = Boolean(views && views.length > 0)
  const hasTools = Boolean(onSearchChange || onRefresh || onDownload || actions)
  const showBulkBar = selected.length > 0
  const firstColIndex = 1
  const lastColIndex = gridColumns.length

  return (
    <Box sx={{ "--digit-table-inset": `${insetPx}px`, minWidth: 0 }}>
      {showBulkBar ? (
        // Multi-select toolbar (12255:57447): replaces the view toolbar while rows are selected.
        <Box sx={{ ...toolbarSx, borderColor: "border.default" }}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 2, minWidth: 0, pl: 1 }}>
            <Typography variant="body1" color="text.primary" noWrap>
              {selected.length} selected
            </Typography>
            {selection?.actions && (
              <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                {selection.actions}
              </Stack>
            )}
          </Stack>
          <Button variant="text" endIcon={<X size={16} />} onClick={() => selection?.onChange([])}>
            Clear
          </Button>
        </Box>
      ) : (
        (hasViews || hasTools) && (
          // View toolbar (12255:55528): saved views left, 28px icon buttons right.
          <Box sx={{ ...toolbarSx, borderColor: "border.solidDefault" }}>
            <Stack
              direction="row"
              role={hasViews ? "group" : undefined}
              aria-label={hasViews ? "Views" : undefined}
              sx={{ alignItems: "center", gap: 1, minWidth: 0, overflowX: "auto" }}
            >
              {views?.map((option) => {
                const current = option.value === view
                return (
                  <Button
                    key={option.value}
                    variant={current ? "outlined" : "text"}
                    aria-pressed={current}
                    onClick={() => onViewChange?.(option.value)}
                    sx={{ flexShrink: 0 }}
                  >
                    {option.label}
                  </Button>
                )
              })}
            </Stack>
            <Stack direction="row" sx={{ alignItems: "center", gap: 1, flexShrink: 0 }}>
              {onSearchChange && (
                <TableSearch
                  value={search ?? ""}
                  onChange={onSearchChange}
                  placeholder={searchPlaceholder}
                />
              )}
              {onRefresh && (
                <Tooltip title="Refresh">
                  <IconButton aria-label="Refresh" onClick={onRefresh}>
                    <RefreshCw size={16} />
                  </IconButton>
                </Tooltip>
              )}
              {onDownload && (
                <Tooltip title="Download .csv">
                  <IconButton aria-label="Download .csv" onClick={onDownload}>
                    <Download size={16} />
                  </IconButton>
                </Tooltip>
              )}
              {actions}
            </Stack>
          </Box>
        )
      )}
      <DataGrid
        rows={rows}
        columns={gridColumns}
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
        checkboxSelection={selecting}
        rowSelectionModel={selecting ? rowSelectionModel : undefined}
        onRowSelectionModelChange={selecting ? handleSelectionChange : undefined}
        keepNonExistentRowsSelected={selecting}
        rowHeight={rowHeight}
        loading={loading}
        autoHeight
        slots={{ footer: TableFooter }}
        onRowClick={onRowClick ? (params) => onRowClick(params.row) : undefined}
        sx={{
          "& .MuiDataGrid-row": {
            cursor: onRowClick ? "pointer" : "default",
          },
          // The page gutter sits inside the first and last cells, so rows stay full bleed. With a
          // single column the two selectors are the same key, so they merge into one rule.
          ...gutterRules(firstColIndex, lastColIndex, insetVar),
        }}
      />
    </Box>
  )
}
