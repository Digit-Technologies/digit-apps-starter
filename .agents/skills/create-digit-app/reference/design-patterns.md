# Design patterns

The theme makes an app look like the platform. These patterns make it **work** like the
platform: where things sit, how lists read, how actions are grouped, and how status is
shown. Read this before you lay out a screen. [theming.md](theming.md) covers the palette
and component overrides.

## How to use this file

1. Find the closest need in the index.
2. Build with the reusable piece named there. If `@digit/lib-frontend` already has one, use it.
3. If no pattern fits, say so in your summary. Do not invent a layout.

## Index

| Pattern                                                     | Use it for                                                    | Built with                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------- |
| [Lists of records](#lists-of-records)                       | Any list of records, with paging, sorting and search          | `Table`, `Pill`, `Button`                     |
| [Settings and detail panel](#settings-and-detail-panel)     | Settings, or the details of one record, beside the page       | `Drawer` (right), `Tabs`, `Switch`, `Select`  |
| [Secondary actions menu](#secondary-actions-menu)           | Grouping secondary actions behind one button                  | `IconButton`, `Menu`, `MenuItem`              |
| [Primary action](#primary-action)                           | The one main thing a surface asks the user to do              | `Button` (primary)                            |
| [Tabs](#tabs)                                               | Switching between views of the same data                      | `Tabs`, `Tab`                                 |
| [Colour and status](#colour-and-status)                     | Showing a state or a category                                 | `Pill`                                        |
| [Icons](#icons)                                             | Any icon in a button, a field, a row or a message             | Lucide icons from `@digit/lib-frontend`       |
| [Checklist with progress](#checklist-with-progress)         | Ordered tasks that get marked complete                        | `LinearProgress`, `List`, `Pill`              |
| [Chat composer](#chat-composer)                             | A box where the user types or talks to an assistant           | `TextField`, `IconButton`, `Stack`            |
| [Confirmations](#confirmations)                             | Any destructive action, and actions blocked by something else | `ConfirmDialog`                               |

## Shared visual rules

These apply everywhere.

- **Radius is soft.** Buttons and pills use the theme's small radius. Panels, tables and
  dialogs round more. Do not add heavy borders or drop shadows to cards.
- **Surfaces are neutral.** Backgrounds are the stone scale. Type is `text.primary`, with
  `text.secondary` for supporting text. The page is light and calm.
- **Charcoal is the action colour.** The primary button is the theme's `primary`, which is
  black-grey. Blue means selected (checkboxes, switches, radios). Red means destructive or
  error. Nothing else.
- **Icons are Lucide.** Import them from `@digit/lib-frontend`. See [Icons](#icons).
- **Type is Inter, sentence case.** Titles are bold. Labels, buttons and menu items are
  sentence case, not Title Case and not all caps.
- **Explain, don't just disable.** If something is unavailable, show why next to it.
- **Record pages sit on `background.secondary`.** Index and list pages sit on white. Every page
  header is `PageHeader`. The full native rules (saving, icons, empty values, progress, forms,
  name cells, files) are in SKILL.md under "Native look: additional rules".

### Colours: use the palette, nothing else

Every colour comes from the theme palette. Do not write hex values, `rgb()`, or colour
names from MUI's defaults (MUI's default blue, or `grey.500` from a stock theme).

- **Roles:** `primary` (charcoal), `secondary`, `success`, `warning`, `error`, `info`.
  Use them for meaning: success for done, warning for waiting, error for stopped, info for
  active. Read the shade with `main`, `light` or `dark`, for example
  `sx={{ color: "error.main" }}`.
- **Neutrals:** `stone`, plus `text.primary`, `text.secondary`, `text.disabled`,
  `background.default` and `background.paper`. `grey` is also mapped to the stone scale.
- **Accents:** `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`,
  `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`. Use these
  for categories that are not a meaning, for example a label colour a user picks.

```tsx
import { useTheme } from "@mui/material/styles"

const theme = useTheme()
<Box sx={{ bgcolor: "purple.light", color: "purple.dark" }} />
theme.palette.violet.main        // read a value in code
```

If the design needs a colour that is not in the palette, say so. Do not add one locally.

---

## Lists of records

Use `Table` for every paged list of records. Do not restyle a new table per screen. A small
fixed set (roles, config entries) may use a plain MUI `Table` with no header, because the
theme styles its cells.

A list page is a title, an optional row of tabs, then a `Table`. The primary action sits in
the table's `actions` slot, at the top right.

```tsx
import { Table, Plus } from "@digit/lib-frontend"

<Table
  rows={roles.rows}
  columns={columns}
  rowCount={roles.total}
  paginationModel={paging}
  onPaginationModelChange={setPaging}
  sortModel={sort}
  onSortModelChange={setSort}
  search={search}
  onSearchChange={setSearch}
  searchPlaceholder="Search roles"
  actions={<Button variant="contained" color="primary" startIcon={<Plus size={16} />}>New role</Button>}
  onRowClick={(row) => openDetails(row.id)}
/>
```

- **Paging, sorting and search run on the server.** `Table` takes the current models and
  calls your change handlers; refetch in those handlers. Do not sort or filter a full list
  in the browser. Confirm the API's arguments in `graphql-schema://…`.
- **Pagination is required.** `rowCount` is the total across all pages, and the pager
  depends on it.
- Columns are standard MUI X `GridColDef`s. Use `renderCell` for a `Pill`, an avatar group,
  or a relative time.
- Rows lead with a bold name, then muted facts. Use a `Pill` for the state a user scans for.
- Clicking a row opens its details in the [settings and detail panel](#settings-and-detail-panel).
- Omit `onSearchChange` if the list needs no search. Omit `onSortModelChange` to turn
  sorting off.

## Settings and detail panel

A side panel docked to the right edge, opened from the page for settings or for one
record's details. It sits beside the content, so the list stays visible. Apps usually have
few settings, so this is the only settings surface. Do not build a full-screen settings
modal.

- Header: the title on the left, a close (×) on the right. Optional tabs under the header.
- Body: sections of label-left rows. The label sits on the left, the control on the right.
  Use `Switch` for on/off, `Select` for a fixed set, and a text field for free text.
- If the panel edits data, put one primary action in a footer on the right. A read-only
  details panel has no footer.
- Build one panel component and reuse it across the app. Do not build a new side panel
  per screen.

## Secondary actions menu

Actions that are not the main thing (duplicate, export, delete) go behind a single
**⋯** icon button, not as extra buttons next to the primary action. The ⋯ button is what
this pattern is called; the menu it opens groups the secondary actions.

- Use the `Ellipsis` icon. `IconButton` with `aria-label="More actions"`, opening a `Menu`.
- List the actions in sentence case. Put the destructive one last, in red, with no divider before it.
  Destructive items still open a [confirmation](#confirmations).
- The primary action stays visible outside the menu.

## Primary action

Each surface has one primary action: a filled charcoal `Button` with a label and, where it
helps, an icon.

- Top right of a page for creating something. Right side of a panel or dialog footer for
  saving.
- Secondary actions are the default `Button` (white, with a border). Never use `variant="outlined"`:
  in this theme it is a grey fill that native screens do not use. Tertiary ones are text buttons.
- Cancel is a text button on the left of the footer when there is a save.
- The primary button is never red. Red is for destructive actions only.

## Tabs

Tabs sit under the page title and switch between views of the same data (for example
"Your features" and "All features"). They are not for moving between apps.

- Use an underline indicator. An icon in the first tab is fine.
- A view switch in a toolbar, or a segmented filter, uses `ToggleButtonGroup` instead of tabs.
- Keep tab labels to one or two words.

## Colour and status

Use `Pill` for any status or category. It is the one place a status gets its colour.

```tsx
import { Pill } from "@digit/lib-frontend"

<Pill status="in progress" />              // warning tone, from the status word
<Pill status={order.state} />              // unknown words render as the neutral tone
<Pill color="purple" label="Vendor" />     // any palette colour, for a category
```

- `status` takes the tone from the shared status list below. The label is the status in
  sentence case, unless you pass `label`.
- `color` sets the colour directly. Pass any tone (`success`, `warning`, `error`, `info`,
  `default`) or any accent (`purple`, `teal`, and so on). When both are set, `color` wins.
- The default tone is outlined. Every other colour is tinted.

Only the obvious statuses are on the list. Anything else is a category, so pass `color`:

| Tone      | Meaning                   | Status words                                    |
| --------- | ------------------------- | ----------------------------------------------- |
| `gray`    | Set aside                 | `draft`, `archived`                             |
| `blue`    | Not started, or underway  | `not started`, `active`, `building`             |
| `green`   | Live, or done             | `live`, `complete`, `completed`, `done`         |
| `yellow`  | Waiting or in progress    | `pending`, `in progress`                        |
| `red`     | Stopped                   | `blocked`, `failed`                             |

- Do not use `Chip` directly for statuses. Do not pick colours by hand.
- If a status word is missing from the list, pass the right `color` for this one use and
  tell the user the word should be added to the status list in `@digit/lib-frontend`.

## Icons

Icons are Lucide. Import them from the package root, never from `lucide-react` directly:

```tsx
import { Plus, Search, Trash2 } from "@digit/lib-frontend"

<Plus size={16} />
```

- The icons available are the names exported from `packages/lib-frontend/src/icons.ts`.
  Read that file for the current list rather than relying on a copy here.
- If you need an icon that is not in that list, say so and name it. Do not import a
  different icon set.
- **Icon sizes are 12, 16 and 20 only.** 16 is the default, inline with 13px text and inside
  buttons. 20 stands alone. 12 sits next to 11px overline text.
- Icons inherit the text colour. Set a palette colour only for a status or an error:
  `sx={{ color: "error.main" }}`.
- Icon-only buttons need an `aria-label`. Pair an icon with a label wherever the meaning
  is not obvious.
- Do not mix icon sets on one screen.

## Checklist with progress

An ordered list of tasks grouped into sections, each with a completion measure.

- Each section has a bold heading and a thin `LinearProgress` captioned "value / max unit". It is
  not a percentage (see Progress in SKILL.md).
- Each row has a completion marker, a bold title, a muted description, and a `Pill` on the
  right.
- Done rows stay where they are. Do not reorder the list when a task completes.
- A blocked task shows the reason and who is fixing it, in one line under the row.

## Chat composer

A conversation column with a composer at the bottom. The composer is a text field with a
placeholder, an optional attach button (`Paperclip`) and a send button (`Send`), which is an
icon button in the primary charcoal.

- Assistant messages sit in soft cards. The user's messages are muted pills or bubbles.
- Keep the composer pinned to the bottom. Do not put it in a panel that scrolls away.
- Use the same send button style as the primary action.

## Confirmations

**Any destructive action asks first.** Delete, remove, cancel an order, or any change that
cannot be undone opens a confirmation before it runs. A non-destructive change, such as
renaming or saving a draft, does not need one.

Use `ConfirmDialog` from `@digit/lib-frontend`. Never use the browser `confirm()`: the app
iframe blocks it.

```tsx
import { ConfirmDialog } from "@digit/lib-frontend"

<ConfirmDialog
  open={confirmOpen}
  title="Delete role?"
  description="This cannot be undone."
  confirmLabel="Delete"
  destructive
  busy={deleting}
  onConfirm={handleDelete}
  onCancel={() => setConfirmOpen(false)}
/>
```

- Title is a question. Description is one line on the consequence.
- Confirm label is the verb ("Delete", "Remove"), never "OK".
- `destructive` makes the confirm button red and puts focus on Cancel, so Enter does not
  delete by accident.
- Set `busy` while the action runs, and close the dialog only when it succeeds.

**Blocked.** When an action cannot happen because something else must change first, use
the same dialog with a non-destructive label that takes the user to the fix. Name what
blocks the action in the description, and do not use red. Add a `TriangleAlert` icon.

```tsx
import { ConfirmDialog, TriangleAlert } from "@digit/lib-frontend"

<ConfirmDialog
  open={blockedOpen}
  title="Can't delete role"
  description="This role is assigned to users. Reassign them first."
  confirmLabel="Go to users"
  icon={<TriangleAlert size={16} />}
  onConfirm={goToUsers}
  onCancel={() => setBlockedOpen(false)}
/>
```

- Navigating to another part of the platform goes through the host. Check `getHostCapabilities`
  for a navigation method before you write one.
