# Design system

Digit apps run inside the Digit platform, next to its own screens. They must look like those
screens. The **Figma design system is the source of truth** for what every component looks like,
and `@digit/lib-frontend` implements it: `DigitThemeProvider` restyles every MUI component to the
Figma values (light and dark), and the library adds the composite pieces the product mockups use.

Your job is to **compose** those pieces, never to style them. If an app looks like stock MUI, or
like a generic SaaS template, something below was skipped.

Read this file before you write any UI. Then pick a screen recipe from
[design-patterns.md](design-patterns.md) and build from it.

## Contents

- [Non-negotiables](#non-negotiables)
- [Component picker](#component-picker)
- [Typography](#typography)
- [Colour](#colour)
- [Spacing and layout](#spacing-and-layout)
- [Icons](#icons)
- [Page structure](#page-structure)
- [Actions](#actions)
- [Data display](#data-display)
- [Forms](#forms)
- [Dialogs and panels](#dialogs-and-panels)
- [Feedback](#feedback)
- [Copy and values](#copy-and-values)
- [Self-check before you finish](#self-check-before-you-finish)

## Non-negotiables

1. **Use the library component when one exists.** `PageHeader`, `Table`, `Pill`, `RecordName`,
   `ConfirmDialog`, `Modal`, `SidePanel`, `SettingsRow`, `SettingsSection`, `Section`,
   `RecordCard`, `PropertyGrid`, `FormField`, `Switch`, `RadioCard`, `EmptyState`, `ProgressBar`,
   `FileDropZone`, `FileUploadRow` and `AppErrorAlert` exist so you never rebuild them from `Box`
   and `Typography`. Import them from `@digit/lib-frontend`.
2. **Never style a themed component.** No `sx`, `style` or `styled()` that sets colour,
   background, border, border radius, box shadow, font size, font weight, line height, height or
   padding on a `Button`, `IconButton`, `TextField`, `Select`, `Checkbox`, `Switch`, `Radio`,
   `Tabs`, `Tab`, `Chip`, `Alert`, `Dialog`, `Menu`, `Tooltip`, `Card` or `Table`. The theme
   already matches Figma; an override breaks it. Layout props (`gap`, `flex`, `width`,
   `maxWidth`, `mt`, `alignSelf`) are fine.
3. **No hex, `rgb()`, px font sizes or hand-picked greys.** Colours come from the palette tokens
   listed under [Colour](#colour). Text styles come from the `Typography` variants listed under
   [Typography](#typography).
4. **Lucide icons only, from `@digit/lib-frontend`**, at 12, 16 or 20px. Never MUI icons, never
   `lucide-react` directly, never emoji as icons.
5. **Sentence case** for every title, label, button and menu item.
6. **Left-aligned.** Titles, labels, cards and buttons sit on the left. Only `EmptyState` and
   `FileDropZone` centre their content.
7. **Buttons size to their label.** Never `fullWidth` on a `Button`, and never stretch one with
   `width: "100%"`, `flex: 1` or a full-width stack (the two answers in `ConfirmDialog` are the
   built-in exception).
8. **No cards around pages, lists or forms.** A list page is a `PageHeader` and a full-bleed
   `Table` on white. A `Card` is only for a grouped block (a dashboard tile, an assistant message).
9. **Light and dark both work for free** if you follow rules 2 and 3. Do not branch on
   `theme.palette.mode` in app code.
10. **Never** browser `alert`/`confirm`/`prompt`; use `ConfirmDialog`. Never `CircularProgress`
    page spinners for a list; `Table` has `loading`.

## Component picker

| You need | Use |
| --- | --- |
| The title bar of any screen, panel or form dialog | `PageHeader` (`variant` page, record or dialog) |
| A list of records | `Table` (server paged, sorted, searched) |
| A short fixed list (roles, config entries) | Plain MUI `Table` + `TableRow hover` + `TableCell`, no `TableHead` |
| A record's name in a list or header | `RecordName` |
| Any status or category | `Pill` |
| A single record's page | `PageHeader variant="record"` + `RecordCard` + `RecordCardSection` |
| Details or settings beside a list | `SidePanel variant="overlay"` |
| Details beside a record | `SidePanel variant="docked"` |
| A heading over a block of content | `Section` (h6 title, overline count or hint, actions) |
| Label/value pairs in a bordered block | `PropertyGrid` |
| A settings page | `SettingsSection` + `SettingsRow variant="setting"` |
| Grants or permissions | `SettingsSection selection` + `SettingsRow variant="list"` + `Checkbox` |
| Fields in a side panel or form dialog | `SettingsRow variant="form"` |
| Fields on a record or a page form | `FormField` (label above) around a `TextField` or `Select` |
| On/off | `Switch label` (with optional `description`) |
| Two or three options that each need a sentence | `RadioGroup` + `RadioCard` |
| A segmented filter or view switch | `ToggleButtonGroup exclusive` (`size="small"` for the outlined track) |
| A form that creates or edits something | `Modal` (title, `ModalSection`s, footer) |
| "Are you sure?" before a destructive or blocked action | `ConfirmDialog` |
| More actions for a row or record | `IconButton` with `Ellipsis` opening a `Menu` |
| Nothing to show yet | `EmptyState` |
| A failed request | `AppErrorAlert` |
| A short inline message | `Alert` (standard variant) |
| A transient result ("Saved", "Copied") | `Snackbar` + `SnackbarContent` |
| Progress toward a total | `ProgressBar` |
| File upload | `FileDropZone` + `FileUploadRow` per file |
| Dashboard tiles | `Card` (outlined, radius 16) in a CSS grid, with `Section` headings |

## Typography

Inter, with tabular figures and a slashed zero on every style. Pick the variant by role; never set
`fontSize` or `fontWeight`.

| Role | Variant | Size / line / weight |
| --- | --- | --- |
| Page, panel and dialog title | `PageHeader title` (h5) | 16/24 600 |
| Record title in its card | `RecordCard title` (h2) | 22/28 600 |
| Section title, name cell, card label | `h6` | 13/16 600 |
| Labels, values, table cells, paragraphs | `body1` | 13/16 400 |
| List-row titles, card titles, emphasised values | `body2` | 13/16 500 |
| A link inside text | `body1Link` | 13/16 600, underline on hover |
| Meta lines, hints, counts beside headings, descriptions under labels, timestamps | `overline` | 11/12 400 |
| Code-like strings only (API keys, raw ids) | `mono` | 12/15 IBM Plex Mono |

- `h1` (24) and `h3`/`h4` (20/18) exist but native screens rarely use them. Do not use `h1` as a
  page title; the page title is `PageHeader`.
- Numbers, money, dates and record ids are `body1` in `text.primary`, never `mono`. Inter's
  tabular figures line them up.
- `caption` (12px) is not used by native screens; use `overline` for small text.
- Text colour: `text.primary` for content, `text.secondary` for supporting facts (email, address,
  SKU, descriptions in panels), `text.tertiary` for hints, descriptions under setting labels,
  "None", computed read-only values and timestamps.

## Colour

Charcoal is the action colour. Blue means selected or focused (checkbox, radio, switch, focus
ring). Red means destructive or error. Everything else is neutral stone. Category colour only ever
appears inside a `Pill`.

| Token | Use |
| --- | --- |
| `text.primary`, `text.secondary`, `text.tertiary`, `text.disabled` | Text and icons |
| `background.default` | Index and list pages (white; #292524 in dark) |
| `background.secondary` | Record pages behind the `RecordCard`, docked panels |
| `background.paper` | Cards, dialogs, menus, panels |
| `background.surface` | An in-app section nav column |
| `border.solidStrong` | Page chrome lines: header bottom, menu outline, nav edge |
| `border.solidDefault` | Section dividers inside a page or card, table toolbar line |
| `border.strong` | Card, panel and dialog outlines (10% alpha) |
| `border.default` / `divider` | Table row and column lines (5% alpha) |
| `error.main` | Error text only. A destructive button gets red from `color="error"` |

Use them through `sx` (`sx={{ color: "text.secondary", borderColor: "border.solidDefault" }}`).
Never use MUI's `grey.*`, `primary.light`, `info.main` or accent colours (`violet`, `sky`, …)
outside a `Pill`.

## Spacing and layout

- The spacing unit is 8px on desktop and 10px below 600px; `sx` numbers (`p: 2`, `gap: 1`) scale
  with it automatically. Use spacing numbers, not px.
- **Page gutter**: 36px (`px: 4.5`) on desktop, 20px below 600px. `PageHeader` and `Table`
  (`inset="page"`) already apply it; content blocks below them use the same gutter.
- **Panel and dialog gutter**: 16px (`p: 2`). `SidePanel`, `Modal` and `Table inset="panel"`
  apply it.
- Sections inside a card or panel stack with **no gap**, separated by a 1px `border.solidDefault`
  line, each padded 16px vertically.
- Heights: buttons, fields, menu items and side-panel rows are 28px; table rows and headers 36px
  (52px with a `RecordName` meta line); page headers 60px; toolbars and footers 44px.
- Widths that recur: side panel 448 (overlay) / 367 (docked); record card max 850; dialogs 336
  (xs), 480 (sm), 680 (md), 960 (lg); label column 128; setting control column 256.

## Icons

Lucide, imported from `@digit/lib-frontend` (see `packages/lib-frontend/src/icons.ts` for the
list; `Box`, `Link` and `Text` are exported as `BoxIcon`, `LinkIcon`, `TextIcon`). If you need one
that is not exported, say so and name it.

- **16** inline with 13px text, inside buttons, fields, menu items and tabs (the theme sizes icons
  inside `Button` and `IconButton` for you).
- **12** next to 11px `overline` text, in table headers, in `Pill`s and meta lines.
- **20** standing alone (the `ConfirmDialog` icon, dashboard task rows).
- Trailing chevrons, "View all" arrows and other helper icons sit at 60% opacity
  (`sx={{ opacity: (t) => t.palette.opacity.helper }}`).
- Icon-only buttons need `aria-label` and a `Tooltip`.

**Domain icons**

| Domain | Icon | Domain | Icon |
| --- | --- | --- | --- |
| Deals | `Handshake` | Inventory | `Layers` |
| Quotes | `ReceiptText` | Receiving | `PackageOpen` |
| Price lists | `FileBox` | Planning | `CalendarRange` |
| Sales orders | `ShoppingCart` | Production | `Factory` |
| Purchase orders | `BaggageClaim` | Shipping | `Truck` |
| Items | `BoxIcon` | Accounts | `BookUser` |
| Reporting | `FileChartLine` | Users | `Users` |
| Settings | `Cog` | App integrations | `Puzzle` |
| Learning center | `BookOpenText` | Chat | `MessageSquareMore` |

**Data type icons** (table column headers, meta lines, field rows)

| Data | Icon | Data | Icon |
| --- | --- | --- | --- |
| Quantity | `Cylinder` | Unit of measure | `Ruler` |
| Status | `Loader` | Date | `Calendar` |
| Time | `Clock` | Money | `DollarSign` |
| Percent | `Percent` | Count / number | `Hash` |
| Text | `TextIcon` | SKU | `Bookmark` |
| Person | `CircleUserRound` | Company | `Building2` |
| Custom field | `TextCursorInput` | Actions | `Zap` |
| Tags / types | `Tags` | Linked records | `LinkIcon` |

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
  buttons, then **one** contained primary button, last.
- `subtitle` for a short caption; `onClose` adds the X.

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
| Destructive | `color="error"` on the button's normal variant: it keeps its neutral look and turns red on hover and press. Usually only inside `ConfirmDialog destructive` |

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

**`RecordName`**: 20px tile + name; with `meta` (a list of `{ icon, label?, value }`) a 36px tile
and an overline meta line (then pass `rowHeight={52}` to `Table`). `placeholder` picks the tile
icon (`item`, `company`, `user`, `tool`); `image` shows a thumbnail. `onClick`/`href` make it a
real link.

**`Pill`**: every status and category. Never `Chip` for a status.

| Tone | Status words (`status=`) |
| --- | --- |
| `gray` | draft, archived, closed, cancelled |
| `blue` | open, not started, active, building |
| `green` | live, approved, received, complete, completed, done |
| `yellow` | pending, in progress, shipped |
| `orange` | ready |
| `violet` | sent |
| `red` | blocked, failed, stopped, rejected |
| outlined | any other word |

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
  field. Options are `MenuItem`.
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
  phrased as answers ("Delete", "No, keep it", "Go to users"), never "OK".

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

## Copy and values

- Sentence case everywhere ("New bin", "Select all"). Labels are nouns; buttons are verbs.
- Missing text is "None" in `text.tertiary`. Not applicable is an empty cell. Never "null",
  "N/A" or "-".
- Numeric zero is "0.00", right-aligned. Lists of values are comma separated ("640.00 ft², 300.00 lb").
- Several values in one cell show "Multiple" with a chevron that opens a menu of them.
- Dates are `body1` in `text.primary`; relative times ("1d ago") are `overline` `text.tertiary`.
- Explain, don't just disable: when something is unavailable, say why next to it.

## Self-check before you finish

Go through this list on every screen you built. Fix anything that fails.

- [ ] Every screen starts with `PageHeader`; there is no hand-built header, no `h1`, no centred
      title block.
- [ ] Lists use `Table` (or a plain MUI table for a short fixed list), full bleed, with no card
      around them; the create action is in the page header.
- [ ] Every status or category is a `Pill`; no `Chip`, no coloured text for status.
- [ ] No `sx` sets colour, background, border, radius, shadow, font or height on a themed MUI
      component; no hex values; no px font sizes; no `fontWeight`.
- [ ] Buttons: one primary per surface, last in its group; secondary is the default `Button`;
      Cancel is a text button; no `fullWidth`.
- [ ] Icons are Lucide from `@digit/lib-frontend` at 12/16/20; icon-only buttons have an
      `aria-label` and a `Tooltip`.
- [ ] Destructive actions go through `ConfirmDialog destructive`; forms with fields are a
      `Modal` or `SidePanel`, not a custom dialog.
- [ ] Fields are the themed grey or invisible fields with labels from `FormField` or
      `SettingsRow`; no floating labels, no outlined strokes.
- [ ] Empty, loading and error states exist and use `EmptyState`, `loading` and `AppErrorAlert`.
- [ ] The screen matches the closest recipe in [design-patterns.md](design-patterns.md), and you
      named that recipe in your summary.
- [ ] It looks right in dark mode too (if you followed the rules, it does).
