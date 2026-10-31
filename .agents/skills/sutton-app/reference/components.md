# Components

How to use each `@heysutton/sdk-react` component and each themed MUI component that has a Sutton
convention. [design-system.md](design-system.md) has the rules and the component picker, and
[design-patterns.md](design-patterns.md) shows how whole screens combine these pieces.

Look up a component here when you use it. You do not need to read this file end to end.

Two kinds of component appear below:

- **Themed MUI components** (`Button`, `TextField`, `Chip`, `Tabs`, `Alert`, …). Import them from
  `@mui/material`. The theme already gives them the Figma look; use their normal MUI props.
- **Library components** (`PageHeader`, `DataTable`, `StatusPill`, `Modal`, …). Import them from
  `@heysutton/sdk-react`. Each one groups themed parts into a larger piece that Figma defines.

## Contents

- [Page structure](#page-structure)
- [Actions](#actions)
- [Data display](#data-display)
- [Forms](#forms)
- [Dialogs and panels](#dialogs-and-panels)
- [Feedback](#feedback)

## Page structure

**`PageHeader`** is the top of every screen. Never build a header bar. (Dialogs and side panels
have their own header: see [Dialogs and panels](#dialogs-and-panels).)

```tsx
<PageHeader
  title="Bins"
  titleAdornment={<Chip size="small" label="Beta" />}
  actions={<>
    <Button startIcon={<SlidersHorizontal />}>Bin settings</Button>
    <Button variant="contained" color="primary" startIcon={<Plus />}>New bin</Button>
  </>}
  tabs={<Tabs value={tab} onChange={(_, v) => setTab(v)}>…</Tabs>}
/>
```

- `variant="page"` (default) for list and index screens; `variant="record"` with `trail` (parent
  crumbs, `[{ label: "Orders", onClick: goBack }]`) for a single record under a list.
- Actions run from least to most used: icon buttons (learning center, star), then secondary
  buttons, then **one** contained primary button, last. A page-level mode toggle (such as
  "Preview data") is a `SwitchField` at the start of `actions`.
- `subtitle` is a short caption after the title.

**`PageBody`**: the page gutter, 24px above and below, and a 32px gap between its children.
Everything under a `PageHeader` that is not a full-bleed `DataTable` goes in it: `Section`s,
`AppErrorAlert`, `EmptyState`, dashboards. `maxWidth={720}` for settings and forms.

**`Section`**: a heading row (h6 `title`, overline `subtitle` such as a count or hint, `actions`
on the right) over a block of content.

- On a page or a dashboard: "Tasks · 4 active" with a "View all" text button.
- **Inside a `Modal`, `SidePanel` or `RecordCard`**, each direct `Section` child becomes a band:
  padded, with a line between bands. Do not add padding or dividers yourself, and do not wrap
  sections in a `Box`, which breaks the band layout. `title` is optional for a band with no
  heading.
- `subtitlePlacement="below"` puts a one-line description under the title instead of beside it.

**`RecordCard`**: the document on a record page. It sits on `background.secondary`, 850px max,
centred, with `title` (h2), `meta` (owner, date) and `status` (a `StatusPill`) in its title row.
Its children are `Section`s, one per block (Customer, Items, Notes).

**`PropertyGrid`**: bordered label/value rows (128px label column), as
`rows={[{ label, value }]}`. Values are text or invisible controls (`Select variant="standard"`,
`TextField variant="standard"`).

**In-app section navigation** (only if the app has sub-pages; the platform owns app navigation):
a 240px `Box` with `bgcolor: "background.secondary"` and a right `border.solidStrong` line; items are
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

**`DataTable`**: every list that can outgrow a screen. Full bleed (no card), page gutter on the
first and last column, server-side paging, sorting and search. (MUI's own `Table` is only for a
short fixed list; see the component picker.)

```tsx
const columns: DataTableColumn<Order>[] = [
  { field: "name", headerName: "Order", flex: 1, icon: Bookmark,
    renderCell: (p) => <RecordName name={p.row.name} link /> },
  { field: "status", headerName: "Status", width: 140, icon: Loader, sortable: false,
    renderCell: (p) => <StatusPill status={orderStage[p.row.status]} label={p.row.statusLabel} /> },
  { field: "total", headerName: "Total", width: 120, icon: DollarSign, type: "number" },
  { field: "dueAt", headerName: "Due", width: 120, icon: Calendar },
]

<DataTable
  rows={rows} columns={columns} rowCount={total}
  paginationModel={paging} onPaginationModelChange={setPaging}
  sortModel={sort} onSortModelChange={setSort}
  search={{ value: search, onChange: setSearch }}
  views={{ options: [{ value: "open", label: "Open" }, { value: "all", label: "All" }], value: view, onChange: setView }}
  onRefresh={refetch}
  onRowClick={(row) => openPanel(row.id)}
  loading={loading}
/>
```

- Column header icons come from the data type table in design-system.md. Numbers are
  `type: "number"` (right aligned).
- The name column renders `RecordName ... link` (600 weight, underlines on row hover); give one
  column `flex: 1` so the last column reaches the gutter.
- `selection={{ model, onChange, actions }}` adds checkboxes; while rows are selected the toolbar
  becomes a bulk-action bar showing `actions`.
- `onDownload` adds a download button to the toolbar (export through `AppHost.invoke("download", …)`).
- `inset="panel"` inside a side panel or dialog; `inset="none"` inside a `Section` band.
- The create action goes in `PageHeader actions`, not in the table toolbar.
- Paging: `paginationModel` is `{ page, pageSize }`. For a GraphQL connection, request
  `first: pageSize` and keep the `endCursor` of each page you have loaded, so page `n` asks for
  `after: cursors[n - 1]`; `rowCount` is the connection's `totalCount`. Reset to page 0 when the
  search, view or sort changes. A backend route with no paging returns the whole list: slice
  it in the browser for the current page and pass its length as `rowCount`.
- No rows yet: render an `EmptyState` (inside `PageBody`) instead of the table, unless a search
  or view is active, in which case keep the table and say nothing matched.

**`RecordName`**: 20px tile + name; with `meta` (a list of `{ icon, label?, value }`) a 36px tile
and an overline meta line (then pass `rowHeight={52}` to `DataTable`). `placeholder` picks the
tile icon (`item`, `company`, `user`, `tool`, or `document` for anything else: notes, files,
reports, runs); `image` shows a thumbnail. `onClick`/`href` make it a real link.

**`StatusPill`**: every record status. Figma groups every status into six stages, and the stage
picks the colour, so the same stage looks the same everywhere in the platform.

| `status` | Colour | Meaning | Example words |
| --- | --- | --- | --- |
| `preliminary` | outlined | A starting point or draft | Draft |
| `open` | blue | Open or ready for work | Open, Sent, Not started, Scheduled |
| `active` | yellow | Being worked on | In progress, Running, Pending, Partially fulfilled |
| `stopped` | red | Needs action to restart | Stopped, Failed, Rejected, Overdue, Blocked |
| `done` | green | Finished, good outcome | Complete, Approved, Paid, Received |
| `closed` | gray | Finished, neutral outcome | Closed, Cancelled, Archived |

Map the app's own status words to a stage once, and pass the word as `label`:

```tsx
const runStage: Record<RunStatus, RecordStatus> = {
  queued: "open", running: "active", failed: "stopped", succeeded: "done", cancelled: "closed",
}

<StatusPill status={runStage[run.status]} label="Running" />
```

- `size="small"` (16px) for inline facts next to names; the default (20px) for a record status.
- A status that opens a menu: `onClick` plus `onDelete={openMenu}` with
  `deleteIcon={<ChevronDown size={12} />}`.

**`Chip`** (MUI, themed as the Figma pill): anything pill-shaped that is not a status.

- A category: `<Chip size="small" color="sky" label="Hardware" />`. Any Tailwind-style accent
  works as `color` (`red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`,
  `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`). Give each
  category one colour and keep it. Built-in or system categories use the default gray (no
  `color`).
- A linked record: `<Chip size="small" color="violet" icon={<Factory size={12} />} label="MO 277" />`.
- A good or bad delta on a dashboard tile: `color="green"` / `color="red"`, not coloured text.
- A tag next to a title (Beta, Custom): `<Chip size="small" label="Beta" />`.

**`Avatar`**: people are round, 20px by default (a table cell), with initials or a photo. For
16px inline (an owner beside a date) set the size variable, which also scales the initials:
`<Avatar sx={{ "--digit-avatar-size": "16px" }}>SB</Avatar>`. Stacks use `AvatarGroup` (16px,
overlapping). Companies and items use `variant="rounded"`.

**`ProgressBar`**: an 8px emerald bar with a right-aligned "value / total unit" overline
caption: `<ProgressBar value={done} total={qty} unit="pcs" />`. Over the total, the caption's
value turns orange with an up arrow.
For a bare bar with no caption, use MUI's `LinearProgress`.

**`EmptyState`**: a tinted horizontal box at the content width: `icon`, a `title`, an optional
`description` and at most one button in `actions` (usually `variant="outlined"` "Learn more" or
the secondary create button).

## Forms

- **Fields are filled grey boxes, 28px**: `<TextField hiddenLabel placeholder="Enter value" />`.
  `size="xs"` is 20px and `size="large"` 36px; leave the default. `variant="outlined"` renders the
  same field.
- **Invisible fields** read as text until hover: `variant="standard"` on `TextField` or `Select`.
  Use them for selects in side panels, property grids and record cards, and for values the user
  rarely edits.
- **Labels** come from `FormField`, which links the label to the control for screen readers:
  - On a record or page form, the label sits **above**: `<FormField label="Name">` around the
    control (`required`, `helperText`, `error`). Lay several fields out in equal columns with
    `gap: 1`.
  - In a side panel or form dialog, the label sits **left** in a 128px column:
    `<FormField horizontal label="Name">`.
  - On a settings page, use `SettingsRow variant="setting"` (label and description left, control
    in a 256px column right). The row does not label the control, so give the control an
    `aria-label` with the same text.
  - Never a floating label. `<TextField label>` also renders the label above, but prefer
    `FormField`.

  ```tsx
  <FormField horizontal label="Customer" required>
    <Select variant="standard" fullWidth displayEmpty value={customerId} onChange={…}>…</Select>
  </FormField>
  ```
- Placeholders: "Enter value", "Select value", "MM/DD/YYYY", "Search…".
- Select: `<Select variant="standard" displayEmpty>` for invisible, plain `<Select>` for the grey
  field. Options are `MenuItem`. For a placeholder, use `displayEmpty` with
  `renderValue={(v) => v ? labelFor(v) : <Typography component="span" color="text.tertiary">Select value</Typography>}`.
- A checkbox with its label: `<FormControlLabel control={<Checkbox />} label="Include archived" />`.
- Dates: `<TextField type="date" hiddenLabel />` (do not add `@mui/x-date-pickers`).
- Multiline notes: `<TextField hiddenLabel multiline minRows={3} />`.
- Lead and trail icons and units go in `InputAdornment` (16px icons).
- `Checkbox`, `Radio` and `Switch` are 16px blue controls.
- **An on/off setting with its label** is a `SwitchField`: the label on the left, the switch on
  the right, a gap between, and the label is clickable. Add `description` for a tertiary line
  under the label and `info` for a tooltip icon. Use MUI's bare `Switch` only where a row already
  draws the label (`SettingsRow`), with an `aria-label`.

  ```tsx
  <SwitchField
    label="Email me when a run fails"
    description="Sent to the app owner."
    checked={notify}
    onChange={(_, checked) => setNotify(checked)}
  />
  ```
- `ToggleButtonGroup exclusive` for a view switch (floating items); `size="small"` gives the
  outlined grey track with xs items (All / Active / Archived).
- Two or three options that each need a sentence: `RadioGroup` with one `RadioCard` per option.
- Uploads: `FileDropZone` for the drop area, one `FileUploadRow` per file (uploading, uploaded,
  failed).

## Dialogs and panels

- **`ConfirmDialog`**: the yes/no question before a destructive or blocked action. 240px, optional
  20px `icon`, the question as `title`, a one-line `description`, two equal answers (outlined
  back-out, contained go-ahead), no X. `destructive` for anything that deletes or cannot be
  undone: the go-ahead turns red on hover and press, and the back-out answer takes focus. `busy`
  while it runs. Answers are phrased as answers ("Delete", "No, keep it", "Go to users"), never
  "OK". If the action fails, keep the dialog open and pass the hook's error as `error`; it shows
  inside the dialog.

  ```tsx
  <ConfirmDialog
    open={confirmOpen}
    title="Delete role?"
    description="Users with this role lose access. This cannot be undone."
    confirmLabel="Delete"
    cancelLabel="Keep role"
    destructive
    busy={deleting}
    error={deleteError}
    onConfirm={handleDelete}
    onCancel={() => setConfirmOpen(false)}
  />
  ```
- **`Modal`**: any dialog with fields or several steps. Header (`title`, optional `subtitle`,
  `tabs`, X), scrolling content made of `Section` bands, and a `footer` with Cancel (text) on the
  left and `secondary` + `primary` on the right. `width` xs/sm/md/lg (336/480/680/960). On mobile
  it becomes a bottom sheet.

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
    <Section title="Details">
      <FormField horizontal label="Name">
        <TextField hiddenLabel fullWidth placeholder="Enter value" />
      </FormField>
      <FormField horizontal label="Copy from">
        <Select variant="standard" fullWidth displayEmpty>…</Select>
      </FormField>
    </Section>
  </Modal>
  ```
- **`SidePanel`**: details or settings for one thing, beside the content so the list stays
  visible. `variant="overlay"` (448px, over a list) or `variant="docked"` (367px, in the layout of
  a record page). Header with `title`, `actions` and X, a scrolling body of `Section` bands, and a
  `footer` (Cancel left, primary right) when it edits data. Build one panel per app and reuse it.

  ```tsx
  <SidePanel
    open={Boolean(selectedId)}
    onClose={() => setSelectedId(null)}
    title="Details"
    actions={<IconButton aria-label="More actions"><Ellipsis /></IconButton>}
    footer={{ onCancel: close, primary: <Button variant="contained" color="primary" startIcon={<Save />}>Save</Button> }}
  >
    <Section title="General">
      <FormField horizontal label="Owner">
        <Select variant="standard" fullWidth displayEmpty>…</Select>
      </FormField>
    </Section>
  </SidePanel>
  ```
- A collapsible group of rows inside a panel (permissions, a long settings group) is a
  `SettingsSection size="sm"`; it also becomes a band.
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
- **Loading**: `DataTable loading`, `Button loading`, `Skeleton` blocks for cards. In-progress
  items show in place (a spinner and "Uploading..." in a `FileUploadRow`), not with a page spinner.
