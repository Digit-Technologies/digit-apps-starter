# Components

How to use each `@digit/lib-frontend` component and each themed MUI component that has a Digit
convention. [design-system.md](design-system.md) has the rules and the component picker, and
[design-patterns.md](design-patterns.md) shows how whole screens combine these pieces.

Look up a component here when you use it. You do not need to read this file end to end.

## Contents

- [Page structure](#page-structure)
- [Actions](#actions)
- [Data display](#data-display)
- [Forms](#forms)
- [Dialogs and panels](#dialogs-and-panels)
- [Feedback](#feedback)

## Page structure

**`PageHeader`** is the top of every screen, side panel and form dialog. Never build a header bar.

```tsx
<PageHeader
  title="Bins"
  titleAdornment={<Pill size="sm" label="Beta" />}
  actions={<>
    <Button startIcon={<SlidersHorizontal />}>Bin settings</Button>
    <Button variant="contained" color="primary" startIcon={<Plus />}>New bin</Button>
  </>}
  tabs={<Tabs value={tab} onChange={(_, v) => setTab(v)}>…</Tabs>}
/>
```

- `variant="page"` (default) for list and index screens; `variant="record"` with `trail` for a
  single record under a list; `variant="dialog"` inside a `Dialog` or panel.
- Actions run from least to most used: icon buttons (learning center, star), then secondary
  buttons, then **one** contained primary button, last. A page-level mode toggle (such as
  "Preview data") is a library `Switch label` at the start of `actions`.
- `subtitle` for a short caption; `onClose` adds the X.

**`PageBody`**: the page gutter, 24px above and below, and a 32px gap between its children.
Everything under a `PageHeader` that is not a full-bleed `Table` goes in it: `Section`s,
`AppErrorAlert`, `EmptyState`, dashboards.

**`Section`**: an h6 heading row with an overline count or hint and right-side actions, for blocks
on a page or panel ("Tasks · 4 active" with a "View all" text button).

**`RecordCard`**: the document on a record page. It sits on `background.secondary`, 850px max,
centred, with `title` (h2), `meta` (owner, date) and `status` (a `Pill`) in its title row. Each
block is a `RecordCardSection` (h6 title, optional subtitle and actions), separated by lines.

**`PropertyGrid`**: bordered label/value rows (128px label column). Values are text or invisible
controls (`Select variant="standard"`, `TextField variant="standard"`).

**In-app section navigation** (only if the app has sub-pages; the platform owns app navigation):
a 240px `Box` with `bgcolor: "background.surface"` and a right `border.solidStrong` line; items are
`ListItemButton selected` with a 16px icon and the label; group labels are `overline`
`text.secondary`.

## Actions

**`Button`** (the default is the secondary look, size small, 28px)

| Role | Code |
| --- | --- |
| Primary: the one main action of a page, panel or dialog | `<Button variant="contained" color="primary">` |
| Secondary: everything else that is a button | `<Button>` (white, 1px border) |
| Tertiary: Cancel, Select all, View all | `<Button variant="text">` |
| Utility grey (a "Learn more" in an empty state, the cancel answer in `ConfirmDialog`) | `<Button variant="outlined">` |
| Destructive | `color="error"` (charcoal primary look) or `color="errorSecondary"` (white secondary look). Both keep their neutral colours at rest and turn red on hover and press. Usually only inside `ConfirmDialog destructive` |

- Leading icon: `startIcon={<Plus />}`. Save buttons use `Save`. A trailing chevron for a menu:
  `endIcon={<ChevronDown />}`.
- Sizes: `size="xs"` (20px, dense inline actions), default `small` (28px), `medium` (36px, rare).
- Saving: `<Button variant="contained" color="primary" loading={busy} loadingPosition="start" startIcon={<Save />}>Save</Button>`.
  The spinner replaces the icon and the label stays. Keep Save disabled until the form is dirty.
  Never show progress with `disabled` alone or by changing the label to "Saving...".
- Never put a red button in a list row or a page header.

**`IconButton`**: 28px square, 16px Lucide icon, `aria-label` and a `Tooltip`. `color` picks the
look: default is the text look; `primary` and `secondary` are the contained looks; `error` is
destructive. `size="xs"` is 20px.

**Overflow menu**: `IconButton aria-label="More actions"` with `Ellipsis` opens a `Menu`. Items
are `MenuItem` with a 16px `ListItemIcon`. The destructive item goes last, and opens
`ConfirmDialog destructive`. The primary action stays outside the menu.

## Data display

**`Table`**: every list that can outgrow a screen. Full bleed (no card), page gutter on the first
and last column, server-side paging, sorting and search.

```tsx
const columns: TableColumn<Order>[] = [
  { field: "name", headerName: "Order", flex: 1, icon: Bookmark,
    renderCell: (p) => <RecordName name={p.row.name} link /> },
  { field: "status", headerName: "Status", width: 120, icon: Loader,
    renderCell: (p) => <Pill status={p.row.status} /> },
  { field: "total", headerName: "Total", width: 120, icon: DollarSign, type: "number" },
  { field: "dueAt", headerName: "Due", width: 120, icon: Calendar },
]

<Table
  rows={rows} columns={columns} rowCount={total}
  paginationModel={paging} onPaginationModelChange={setPaging}
  sortModel={sort} onSortModelChange={setSort}
  search={search} onSearchChange={setSearch}
  views={[{ value: "all", label: "All" }, { value: "open", label: "Open" }]}
  view={view} onViewChange={setView}
  onRefresh={refetch}
  onRowClick={(row) => openPanel(row.id)}
  loading={loading}
/>
```

- Column header icons come from the data type table. Numbers are `type: "number"` (right aligned).
- The name column renders `RecordName ... link` (600 weight, underlines on row hover); give one
  column `flex: 1` so the last column reaches the gutter.
- `selection={{ model, onChange, actions }}` adds checkboxes and a bulk-action bar.
- `inset="panel"` inside a side panel or dialog.
- The create action goes in `PageHeader actions`, not in the table toolbar.
- Paging: `paginationModel` is `{ page, pageSize }`. For a GraphQL connection, request
  `first: pageSize` and keep the `endCursor` of each page you have loaded, so page `n` asks for
  `after: cursors[n - 1]`; `rowCount` is the connection's `totalCount`. Reset to page 0 when the
  search, view or sort changes. A backend route with no paging returns the whole list: slice
  it in the browser for the current page and pass its length as `rowCount`.
- No rows yet: render an `EmptyState` (inside `PageBody`) instead of the table, unless a search
  or view is active, in which case keep the table and say nothing matched.

**`RecordName`**: 20px tile + name; with `meta` (a list of `{ icon, label?, value }`) a 36px tile
and an overline meta line (then pass `rowHeight={52}` to `Table`). `placeholder` picks the tile
icon (`item`, `company`, `user`, `tool`, or `document` for anything else: notes, files,
reports, runs); `image` shows a thumbnail. `onClick`/`href` make it a
real link.

**`Pill`**: every status and category. Never `Chip` for a status.

| Tone | Status words (`status=`) |
| --- | --- |
| `gray` | closed, cancelled, archived, paused |
| `blue` | open, not started, active, building, running, scheduled |
| `green` | live, approved, received, complete, completed, done, succeeded, success |
| `yellow` | pending, queued, waiting, in progress, shipped |
| `orange` | ready |
| `violet` | sent |
| `red` | blocked, failed, stopped, rejected |
| outlined | draft, and any word not listed |

Pass the record's own status word (`<Pill status={run.status} />`); the label is the word in
sentence case. If a word your data uses is missing, pass `color` for now and tell the user the
word should be added to the list in `Pill.tsx`.

- `color="sky"` (any accent) for a category; `color="gray"` for built-in or system categories.
- `size="md"` (20px, default) for record status; `size="sm"` (16px) for inline facts and
  categories next to names.
- A status that opens a menu: `endAdornment={<ChevronDown size={12} />}` and `onClick`.
- A linked record: `<Pill color="violet" icon={<Factory size={12} />} label="MO 277" />`.

**`Avatar`**: people are round, 20px by default (a table cell), with initials or a photo. For
16px inline (an owner beside a date) set the size variable, which also scales the initials:
`<Avatar sx={{ "--digit-avatar-size": "16px" }}>SB</Avatar>`. Stacks use `AvatarGroup` (16px,
overlapping). Companies and items use `variant="rounded"`.

**`ProgressBar`**: an 8px emerald bar with a right-aligned "value / total unit" overline caption.

**`EmptyState`**: a tinted horizontal box at the content width: icon or illustration, an
`body2` title, an optional description and at most one action (usually `variant="outlined"`
"Learn more" or the secondary create button).

## Forms

- **Fields are filled grey boxes, 28px**: `<TextField hiddenLabel placeholder="Enter value" />`.
  `size="xs"` is 20px and `size="large"` 36px; leave the default. `variant="outlined"` renders the
  same field.
- **Invisible fields** read as text until hover: `variant="standard"` on `TextField` or `Select`.
  Use them for selects in side panels, property grids and record cards, and for values the user
  rarely edits.
- **Labels**:
  - On a record or page form, the label sits **above**: wrap the control in `FormField label`
    (`required`, `helperText`, `error`). Lay several fields out in equal columns with `gap: 1`.
  - In a side panel or form dialog, the label sits **left** in a 128px column:
    `SettingsRow variant="form" label control={...}`.
  - On a settings page, label and tertiary description on the left, control in a 256px column on
    the right: `SettingsRow variant="setting" label description control={...}`.
  - `<TextField label>` also renders the label above (never a floating label), but prefer
    `FormField`.
- Placeholders: "Enter value", "Select value", "MM/DD/YYYY", "Search…".
- Select: `<Select variant="standard" displayEmpty>` for invisible, plain `<Select>` for the grey
  field. Options are `MenuItem`. For a placeholder, use `displayEmpty` with
  `renderValue={(v) => v ? labelFor(v) : <Typography component="span" color="text.tertiary">Select value</Typography>}`.
- A checkbox with its label: `<FormControlLabel control={<Checkbox />} label="Include archived" />`.
- Dates: `<TextField type="date" hiddenLabel />` (do not add `@mui/x-date-pickers`).
- Multiline notes: `<TextField hiddenLabel multiline minRows={3} />`.
- Lead and trail icons and units go in `InputAdornment` (16px icons).
- `Checkbox`, `Radio` and `Switch` are 16px blue controls. A bare MUI `Switch` next to text is
  wrong; use the library `Switch label` (it keeps the gap and the label click).
- `ToggleButtonGroup exclusive` for a view switch (floating items); `size="small"` gives the
  outlined grey track with xs items (All / Active / Archived).
- Uploads: `FileDropZone` for the drop area, one `FileUploadRow` per file (uploading, uploaded,
  failed).

## Dialogs and panels

- **`ConfirmDialog`**: the yes/no question before a destructive or blocked action. 240px, optional
  20px icon, h5 question, one-line consequence, two equal answers (outlined back-out, contained
  go-ahead), no X. `destructive` for anything that deletes or cannot be undone: the go-ahead turns
  red on hover and press, and the back-out answer takes focus. `busy` while it runs. Answers are
  phrased as answers ("Delete", "No, keep it", "Go to users"), never "OK". If the action fails,
  keep the dialog open and pass the hook's error as `error`; it shows inside the dialog.

  ```tsx
  <ConfirmDialog
    open={confirmOpen}
    title="Delete role?"
    description="Users with this role lose access. This cannot be undone."
    confirmLabel="Delete"
    cancelLabel="Keep role"
    destructive
    busy={deleting}
    onConfirm={handleDelete}
    onCancel={() => setConfirmOpen(false)}
  />
  ```
- **`Modal`**: any dialog with fields or several steps. Header (title, optional subtitle, tabs,
  X), scrolling content made of `ModalSection`s (16px padding, h6 title, separator lines), and a
  footer with Cancel (text) on the left and secondary + primary on the right. `width` xs/sm/md/lg
  (336/480/680/960). On mobile it becomes a bottom sheet.

  ```tsx
  <Modal
    open={open}
    onClose={close}
    title="New role"
    subtitle="Roles group the permissions users get."
    footer={{
      onCancel: close,
      primary: (
        <Button variant="contained" color="primary" startIcon={<Save />} loading={saving}
          loadingPosition="start" disabled={!dirty} onClick={save}>Save</Button>
      ),
    }}
  >
    <ModalSection title="Details">
      <SettingsRow variant="form" label="Name" control={<TextField hiddenLabel fullWidth placeholder="Enter value" />} />
      <SettingsRow variant="form" label="Copy from" control={<Select variant="standard" fullWidth displayEmpty>…</Select>} />
    </ModalSection>
  </Modal>
  ```
- **`SidePanel`**: details or settings for one thing, beside the content so the list stays
  visible. `variant="overlay"` (448px, over a list) or `variant="docked"` (367px, in the layout of
  a record page). Header with title and X, scrolling body of `SettingsSection size="sm"` /
  `SettingsRow variant="form"` rows, footer with Cancel left and the primary right when it edits
  data. Build one panel per app and reuse it.

  ```tsx
  <SidePanel
    open={Boolean(selectedId)}
    onClose={() => setSelectedId(null)}
    title="Details"
    actions={<IconButton aria-label="More actions"><Ellipsis /></IconButton>}
    footer={{ onCancel: close, primary: <Button variant="contained" color="primary" startIcon={<Save />}>Save</Button> }}
  >
    <ModalSection title="General">
      <SettingsRow variant="form" label="Owner" control={<Select variant="standard" fullWidth displayEmpty>…</Select>} />
    </ModalSection>
  </SidePanel>
  ```
- Never a full-screen settings page inside the app iframe for a handful of settings; use a
  `SidePanel`.

## Feedback

- **`AppErrorAlert`** for every failed hook result (`onRetry` when retryable). Do not branch on
  error codes in UI.
- **`Alert`** (standard variant, `severity` info/success/warning/error) for an inline message: 12px
  radius tinted box, 16px icon. `<AlertTitle>` turns the message into a title plus an overline
  subtitle. `variant="neutral"` is the untinted paper alert.
- **`Snackbar`** for transient results, bottom left, with `SnackbarContent` (message, optional xs
  text action).
- **`Tooltip`** on every icon-only button and every truncated value.
- **Loading**: `Table loading`, `Button loading`, `Skeleton` blocks for cards. In-progress items
  show in place (a spinner and "Uploading..." in a `FileUploadRow`), not with a page spinner.
